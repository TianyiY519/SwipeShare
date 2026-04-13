from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q

from .models import Post, Comment, PostLike, CommentLike, PostView
from .serializers import (
    PostSerializer,
    PostDetailSerializer,
    PostCreateUpdateSerializer,
    CommentSerializer,
    PostLikeSerializer,
    PostStatsSerializer
)


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for forum posts.

    list: GET /api/posts/
    create: POST /api/posts/
    retrieve: GET /api/posts/{id}/
    update: PUT /api/posts/{id}/
    partial_update: PATCH /api/posts/{id}/
    destroy: DELETE /api/posts/{id}/
    my_posts: GET /api/posts/my-posts/
    like: POST /api/posts/{id}/like/
    stats: GET /api/posts/stats/
    """
    queryset = Post.objects.filter(is_active=True)
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['category', 'user']
    ordering_fields = ['created_at', 'likes_count', 'comments_count']
    ordering = ['-created_at']
    search_fields = ['title', 'content', 'tags']

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'retrieve':
            return PostDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PostCreateUpdateSerializer
        return PostSerializer

    def get_queryset(self):
        """Optimize queryset with select_related"""
        return super().get_queryset().select_related('user')

    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        """Increment view count once per request"""
        post = self.get_object()
        post.views_count += 1
        post.save(update_fields=['views_count'])

        # Mark notifications as seen if post owner is viewing
        if post.user == request.user:
            Comment.objects.filter(
                post=post, is_seen_by_post_owner=False
            ).exclude(user=request.user).update(is_seen_by_post_owner=True)
            PostLike.objects.filter(
                post=post, is_seen_by_post_owner=False
            ).exclude(user=request.user).update(is_seen_by_post_owner=True)

        return Response({'views_count': post.views_count})

    def perform_create(self, serializer):
        """Set user when creating post"""
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Only allow owner to update"""
        if serializer.instance.user != self.request.user:
            raise permissions.PermissionDenied("You can only update your own posts")
        serializer.save()

    def perform_destroy(self, instance):
        """Soft delete - mark as inactive"""
        if instance.user != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("You can only delete your own posts")
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        """Get current user's posts"""
        posts = self.get_queryset().filter(user=request.user)

        # Include inactive posts for the owner
        include_inactive = request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() == 'true':
            posts = Post.objects.filter(user=request.user)

        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """
        Like or unlike a post.
        POST /api/posts/{id}/like/
        """
        post = self.get_object()

        serializer = PostLikeSerializer(
            data={},
            context={'post': post, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        return Response({
            'liked': result['liked'],
            'likes_count': result['likes_count'],
            'message': 'Post liked' if result['liked'] else 'Post unliked'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get post statistics for current user"""
        user = request.user

        # Count posts by category
        posts_by_category = {}
        for category, label in Post.CATEGORY_CHOICES:
            count = user.posts.filter(category=category, is_active=True).count()
            if count > 0:
                posts_by_category[label] = count

        stats = {
            'total_posts': user.posts.count(),
            'active_posts': user.posts.filter(is_active=True).count(),
            'total_comments': user.comments.filter(is_deleted=False).count(),
            'total_likes_received': PostLike.objects.filter(post__user=user).count(),
            'posts_by_category': posts_by_category
        }

        serializer = PostStatsSerializer(stats)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for post comments.

    list: GET /api/comments/?post={post_id}
    create: POST /api/comments/
    retrieve: GET /api/comments/{id}/
    update: PUT /api/comments/{id}/
    partial_update: PATCH /api/comments/{id}/
    destroy: DELETE /api/comments/{id}/
    """
    queryset = Comment.objects.filter(is_deleted=False)
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['post', 'user']
    ordering_fields = ['created_at']
    ordering = ['created_at']

    def get_queryset(self):
        """Optimize queryset; only return top-level comments (replies are nested)"""
        qs = super().get_queryset().select_related('user', 'post')
        # When listing comments for a post, only return top-level ones
        if self.action == 'list' and self.request.query_params.get('post'):
            qs = qs.filter(parent__isnull=True)
        return qs

    def perform_create(self, serializer):
        """Set user when creating comment and update post comment count"""
        comment = serializer.save(user=self.request.user)
        comment.post.update_comments_count()

    def perform_update(self, serializer):
        """Only allow owner to update"""
        if serializer.instance.user != self.request.user:
            raise permissions.PermissionDenied("You can only update your own comments")
        serializer.save()

    def perform_destroy(self, instance):
        """Soft delete - mark as deleted"""
        if instance.user != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("You can only delete your own comments")
        instance.delete()  # This calls our custom delete method

    @action(detail=False, methods=['get'])
    def my_comments(self, request):
        """Get current user's comments"""
        comments = self.get_queryset().filter(user=request.user)

        page = self.paginate_queryset(comments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like or unlike a comment."""
        comment = self.get_object()
        like, created = CommentLike.objects.get_or_create(user=request.user, comment=comment)
        if not created:
            like.delete()
            comment.likes_count = max(0, comment.likes_count - 1)
        else:
            comment.likes_count += 1
        comment.save(update_fields=['likes_count'])
        return Response({
            'liked': created,
            'likes_count': comment.likes_count,
        })
