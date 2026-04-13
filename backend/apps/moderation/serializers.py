from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Report, ContentAction

User = get_user_model()


class ReporterSerializer(serializers.ModelSerializer):
    """Minimal user serializer for reporters"""
    class Meta:
        model = User
        fields = ['id', 'full_name', 'campus']


class ReportSerializer(serializers.ModelSerializer):
    """
    Serializer for content reports.
    """
    reporter = ReporterSerializer(read_only=True)
    reviewed_by = ReporterSerializer(read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'content_type', 'content_id', 'reason',
            'description', 'status', 'admin_notes', 'reviewed_by',
            'reviewed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'reporter', 'status', 'admin_notes', 'reviewed_by',
            'reviewed_at', 'created_at', 'updated_at'
        ]

    def validate(self, attrs):
        """Validate content exists"""
        content_type = attrs.get('content_type')
        content_id = attrs.get('content_id')

        if content_type and content_id:
            # Verify the content exists
            if content_type == 'post':
                from apps.forum.models import Post
                if not Post.objects.filter(id=content_id).exists():
                    raise serializers.ValidationError("Post not found")
            elif content_type == 'comment':
                from apps.forum.models import Comment
                if not Comment.objects.filter(id=content_id).exists():
                    raise serializers.ValidationError("Comment not found")
            elif content_type == 'user':
                if not User.objects.filter(id=content_id).exists():
                    raise serializers.ValidationError("User not found")
            elif content_type == 'swipe_listing':
                from apps.swipes.models import SwipeListing
                if not SwipeListing.objects.filter(id=content_id).exists():
                    raise serializers.ValidationError("Swipe listing not found")

        return attrs

    def create(self, validated_data):
        """Set reporter from request context"""
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)


class ReportDetailSerializer(ReportSerializer):
    """
    Detailed serializer for reports with actions.
    """
    actions = serializers.SerializerMethodField()
    content_details = serializers.SerializerMethodField()

    class Meta(ReportSerializer.Meta):
        fields = ReportSerializer.Meta.fields + ['actions', 'content_details']

    def get_actions(self, obj):
        """Get all actions taken on this report"""
        actions = obj.actions.all().order_by('-created_at')
        return ContentActionSerializer(actions, many=True).data

    def get_content_details(self, obj):
        """Get details of the reported content"""
        try:
            if obj.content_type == 'post':
                from apps.forum.models import Post
                post = Post.objects.get(id=obj.content_id)
                return {
                    'title': post.title,
                    'content_preview': post.content[:100] + '...' if len(post.content) > 100 else post.content,
                    'user': post.user.full_name,
                    'is_active': post.is_active
                }
            elif obj.content_type == 'comment':
                from apps.forum.models import Comment
                comment = Comment.objects.get(id=obj.content_id)
                return {
                    'content_preview': comment.content[:100] + '...' if len(comment.content) > 100 else comment.content,
                    'user': comment.user.full_name,
                    'is_deleted': comment.is_deleted
                }
            elif obj.content_type == 'user':
                user = User.objects.get(id=obj.content_id)
                return {
                    'full_name': user.full_name,
                    'email': user.email,
                    'campus': user.campus,
                    'is_active': user.is_active
                }
            elif obj.content_type == 'swipe_listing':
                from apps.swipes.models import SwipeListing
                listing = SwipeListing.objects.get(id=obj.content_id)
                return {
                    'type': listing.type,
                    'campus': listing.campus,
                    'user': listing.user.full_name,
                    'status': listing.status
                }
        except:
            return {'error': 'Content not found'}


class ReportUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating report status (admin only).
    """
    class Meta:
        model = Report
        fields = ['status', 'admin_notes']

    def validate_status(self, value):
        """Validate status transition"""
        valid_statuses = ['pending', 'under_review', 'resolved', 'dismissed']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        return value


class ContentActionSerializer(serializers.ModelSerializer):
    """
    Serializer for content moderation actions.
    """
    target_user = ReporterSerializer(read_only=True)
    admin = ReporterSerializer(read_only=True)

    class Meta:
        model = ContentAction
        fields = [
            'id', 'report', 'action_type', 'target_user', 'admin',
            'notes', 'duration_days', 'created_at'
        ]
        read_only_fields = ['id', 'admin', 'created_at']

    def validate(self, attrs):
        """Validate action data"""
        action_type = attrs.get('action_type')
        duration_days = attrs.get('duration_days')

        # Check if duration is required for suspension/ban
        if action_type in ['user_suspended', 'user_banned'] and not duration_days:
            raise serializers.ValidationError({
                'duration_days': 'Duration is required for suspensions and bans'
            })

        return attrs

    def create(self, validated_data):
        """Set admin from request context"""
        validated_data['admin'] = self.context['request'].user

        # Get target user from report
        report = validated_data['report']
        if report.content_type == 'user':
            validated_data['target_user'] = User.objects.get(id=report.content_id)
        elif report.content_type in ['post', 'comment']:
            # Get the user who created the content
            if report.content_type == 'post':
                from apps.forum.models import Post
                post = Post.objects.get(id=report.content_id)
                validated_data['target_user'] = post.user
            else:
                from apps.forum.models import Comment
                comment = Comment.objects.get(id=report.content_id)
                validated_data['target_user'] = comment.user
        elif report.content_type == 'swipe_listing':
            from apps.swipes.models import SwipeListing
            listing = SwipeListing.objects.get(id=report.content_id)
            validated_data['target_user'] = listing.user

        return super().create(validated_data)


class ModerationStatsSerializer(serializers.Serializer):
    """
    Serializer for moderation statistics.
    """
    total_reports = serializers.IntegerField()
    pending_reports = serializers.IntegerField()
    under_review_reports = serializers.IntegerField()
    resolved_reports = serializers.IntegerField()
    dismissed_reports = serializers.IntegerField()
    reports_by_type = serializers.DictField()
    reports_by_reason = serializers.DictField()
    total_actions = serializers.IntegerField()
