from django.db import models
from django.conf import settings


class Post(models.Model):
    """
    Represents a forum post in various categories like housing, marketplace, etc.
    """
    CATEGORY_CHOICES = [
        ('housing', 'Housing & Sublets'),
        ('marketplace', 'Marketplace'),
        ('rideshare', 'Ride Sharing'),
        ('events', 'Events'),
        ('general', 'General Discussion'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    images = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    views_count = models.IntegerField(default=0)
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['-likes_count']),
        ]

    def __str__(self):
        return f"{self.title} by {self.user.full_name}"

    def increment_likes(self):
        """Increment the likes count"""
        self.likes_count += 1
        self.save(update_fields=['likes_count'])

    def decrement_likes(self):
        """Decrement the likes count"""
        if self.likes_count > 0:
            self.likes_count -= 1
            self.save(update_fields=['likes_count'])

    def update_comments_count(self):
        """Update comments count based on actual comments"""
        self.comments_count = self.comments.filter(is_deleted=False).count()
        self.save(update_fields=['comments_count'])


class Comment(models.Model):
    """
    Represents a comment on a forum post.
    """
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    content = models.TextField()
    image = models.URLField(max_length=500, blank=True, null=True)
    likes_count = models.IntegerField(default=0)
    is_deleted = models.BooleanField(default=False)
    is_seen_by_post_owner = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"Comment by {self.user.full_name} on {self.post.title}"

    def delete(self, *args, **kwargs):
        """Soft delete - mark as deleted instead of removing from database"""
        self.is_deleted = True
        self.content = "[This comment has been deleted]"
        self.save()
        # Update post's comment count
        self.post.update_comments_count()


class PostLike(models.Model):
    """
    Tracks which users liked which posts to prevent duplicate likes.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='post_likes'
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    is_seen_by_post_owner = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'post']
        indexes = [
            models.Index(fields=['user', 'post']),
        ]

    def __str__(self):
        return f"{self.user.full_name} likes {self.post.title}"


class CommentLike(models.Model):
    """Tracks which users liked which comments."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comment_likes')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'comment']


class PostView(models.Model):
    """Tracks unique views per user per post."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='views')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'post']
