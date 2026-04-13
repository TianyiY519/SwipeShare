from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Report(models.Model):
    """
    Represents a report filed by a user for inappropriate content or behavior.
    Uses Django's ContentType framework for flexible reporting of different model types.
    """
    CONTENT_TYPES = [
        ('post', 'Post'),
        ('comment', 'Comment'),
        ('user', 'User'),
        ('swipe_listing', 'Swipe Listing'),
    ]

    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('inappropriate', 'Inappropriate Content'),
        ('harassment', 'Harassment'),
        ('misinformation', 'Misinformation'),
        ('scam', 'Scam or Fraud'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_made'
    )
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    content_id = models.IntegerField()
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_reviewed'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['reporter', '-created_at']),
            models.Index(fields=['content_type', 'content_id']),
        ]

    def __str__(self):
        return f"Report: {self.content_type} #{self.content_id} by {self.reporter.full_name}"

    def mark_under_review(self, admin_user):
        """Mark report as under review by an admin"""
        self.status = 'under_review'
        self.reviewed_by = admin_user
        from django.utils import timezone
        self.reviewed_at = timezone.now()
        self.save()

    def resolve(self, admin_user, admin_notes=''):
        """Mark report as resolved"""
        self.status = 'resolved'
        self.reviewed_by = admin_user
        self.admin_notes = admin_notes
        from django.utils import timezone
        if not self.reviewed_at:
            self.reviewed_at = timezone.now()
        self.save()

    def dismiss(self, admin_user, admin_notes=''):
        """Dismiss report as invalid or not requiring action"""
        self.status = 'dismissed'
        self.reviewed_by = admin_user
        self.admin_notes = admin_notes
        from django.utils import timezone
        if not self.reviewed_at:
            self.reviewed_at = timezone.now()
        self.save()

    @property
    def is_pending(self):
        """Check if report is still pending"""
        return self.status == 'pending'

    @property
    def is_resolved(self):
        """Check if report has been resolved"""
        return self.status in ['resolved', 'dismissed']


class ContentAction(models.Model):
    """
    Tracks actions taken on reported content (warnings, suspensions, content removal).
    """
    ACTION_TYPES = [
        ('warning', 'Warning Issued'),
        ('content_removed', 'Content Removed'),
        ('user_suspended', 'User Suspended'),
        ('user_banned', 'User Banned'),
        ('no_action', 'No Action Taken'),
    ]

    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name='actions'
    )
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='moderation_actions'
    )
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_actions'
    )
    notes = models.TextField()
    duration_days = models.IntegerField(
        null=True,
        blank=True,
        help_text="Duration in days for suspensions/bans"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['target_user', '-created_at']),
            models.Index(fields=['admin', '-created_at']),
        ]

    def __str__(self):
        return f"{self.action_type} on {self.target_user.full_name} by {self.admin.full_name}"
