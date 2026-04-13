from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, Comment, PostLike

User = get_user_model()


class PostUserSerializer(serializers.ModelSerializer):
    """Minimal user serializer for posts and comments"""
    class Meta:
        model = User
        fields = ['id', 'full_name', 'campus', 'profile_picture']


class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer for comments on forum posts.
    """
    user = PostUserSerializer(read_only=True)
    can_delete = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'user', 'parent', 'content', 'image', 'likes_count', 'is_deleted',
            'created_at', 'updated_at', 'can_delete', 'replies'
        ]
        read_only_fields = ['id', 'user', 'likes_count', 'is_deleted', 'created_at', 'updated_at']

    def get_can_delete(self, obj):
        """Check if current user can delete this comment"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.user == request.user or request.user.is_staff

    def get_replies(self, obj):
        """Get replies to this comment (only for top-level comments)"""
        if obj.parent is not None:
            return []
        replies = obj.replies.filter(is_deleted=False).order_by('created_at')
        return CommentSerializer(replies, many=True, context=self.context).data

    def validate_content(self, value):
        """Validate comment content"""
        if not value or not value.strip():
            raise serializers.ValidationError("Comment content cannot be empty")
        if len(value) > 1000:
            raise serializers.ValidationError("Comment is too long (max 1000 characters)")
        return value.strip()


class PostSerializer(serializers.ModelSerializer):
    """
    Serializer for forum posts.
    """
    user = PostUserSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'category', 'title', 'content', 'images', 'tags',
            'views_count', 'likes_count', 'comments_count', 'is_active', 'is_liked',
            'can_edit', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'views_count', 'likes_count', 'comments_count',
            'is_active', 'created_at', 'updated_at'
        ]

    def get_is_liked(self, obj):
        """Check if current user has liked this post"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return PostLike.objects.filter(user=request.user, post=obj).exists()

    def get_can_edit(self, obj):
        """Check if current user can edit this post"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.user == request.user

    def validate_title(self, value):
        """Validate post title"""
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty")
        if len(value) > 200:
            raise serializers.ValidationError("Title is too long (max 200 characters)")
        return value.strip()

    def validate_content(self, value):
        """Validate post content"""
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty")
        if len(value) > 10000:
            raise serializers.ValidationError("Content is too long (max 10000 characters)")
        return value.strip()

    def validate_images(self, value):
        """Validate images list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Images must be a list")
        if len(value) > 5:
            raise serializers.ValidationError("Maximum 5 images allowed")
        return value


class PostDetailSerializer(PostSerializer):
    """
    Detailed serializer for posts with recent comments.
    """
    recent_comments = serializers.SerializerMethodField()

    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['recent_comments']

    def get_recent_comments(self, obj):
        """Get 3 most recent comments"""
        recent_comments = obj.comments.filter(is_deleted=False).order_by('-created_at')[:3]
        return CommentSerializer(recent_comments, many=True, context=self.context).data


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating posts.
    """
    class Meta:
        model = Post
        fields = ['category', 'title', 'content', 'images', 'tags']

    def validate(self, attrs):
        """Additional validation"""
        if 'title' in attrs:
            attrs['title'] = attrs['title'].strip()
        if 'content' in attrs:
            attrs['content'] = attrs['content'].strip()
        return attrs

    def create(self, validated_data):
        """Set user from request context"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class PostLikeSerializer(serializers.Serializer):
    """
    Serializer for liking/unliking posts.
    """
    def validate(self, attrs):
        """Validate user hasn't already liked the post"""
        post = self.context['post']
        user = self.context['request'].user

        # This validation is optional since we handle it in the view
        return attrs

    def save(self):
        """Toggle like on the post"""
        post = self.context['post']
        user = self.context['request'].user

        like, created = PostLike.objects.get_or_create(user=user, post=post)

        if not created:
            # Unlike - remove the like
            like.delete()
            post.decrement_likes()
            return {'liked': False, 'likes_count': post.likes_count}
        else:
            # Like - increment count
            post.increment_likes()
            return {'liked': True, 'likes_count': post.likes_count}


class PostStatsSerializer(serializers.Serializer):
    """
    Serializer for post statistics.
    """
    total_posts = serializers.IntegerField()
    active_posts = serializers.IntegerField()
    total_comments = serializers.IntegerField()
    total_likes_received = serializers.IntegerField()
    posts_by_category = serializers.DictField()
