from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime

from .models import Report, ContentAction
from .serializers import (
    ReportSerializer,
    ReportDetailSerializer,
    ReportUpdateSerializer,
    ContentActionSerializer,
    ModerationStatsSerializer
)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit.
    Regular users can only create reports.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Allow all users to create reports
        if request.method == 'POST' and view.action == 'create':
            return True

        # Only allow users to view their own reports
        if request.method == 'GET' and view.action not in ['list', 'stats']:
            return True

        # Only admins can list all reports and perform other actions
        if view.action in ['list', 'update', 'partial_update', 'destroy', 'stats']:
            return request.user.is_staff

        return request.user.is_staff


class ReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for content reports.

    create: POST /api/reports/ (all users)
    list: GET /api/reports/ (admin only)
    retrieve: GET /api/reports/{id}/ (reporter or admin)
    update: PUT /api/reports/{id}/ (admin only)
    my_reports: GET /api/reports/my-reports/ (all users)
    stats: GET /api/reports/stats/ (admin only)
    """
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'content_type', 'reason']
    ordering_fields = ['created_at', 'reviewed_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'retrieve':
            return ReportDetailSerializer
        elif self.action in ['update', 'partial_update']:
            return ReportUpdateSerializer
        return ReportSerializer

    def get_queryset(self):
        """
        Admin sees all reports.
        Regular users only see their own reports.
        """
        if self.request.user.is_staff:
            return super().get_queryset().select_related('reporter', 'reviewed_by')
        return super().get_queryset().filter(reporter=self.request.user)

    def perform_create(self, serializer):
        """Set reporter when creating report"""
        report = serializer.save(reporter=self.request.user)

        # Notify all admin users about the new report
        User = get_user_model()
        admin_emails = list(User.objects.filter(is_staff=True).values_list('email', flat=True))
        if admin_emails:
            send_mail(
                subject=f'[SwipeShare] New report: {report.get_reason_display()} on {report.get_content_type_display()}',
                message=(
                    f'A new report has been filed.\n\n'
                    f'Reporter: {report.reporter.full_name} ({report.reporter.email})\n'
                    f'Content Type: {report.get_content_type_display()} #{report.content_id}\n'
                    f'Reason: {report.get_reason_display()}\n'
                    f'Description: {report.description or "N/A"}\n\n'
                    f'Review it in the admin panel: {settings.FRONTEND_URL}/admin'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=True,
            )

    def perform_update(self, serializer):
        """Update report status and set reviewer"""
        report = serializer.save()

        # If status is being updated, track the reviewer
        if 'status' in serializer.validated_data:
            new_status = serializer.validated_data['status']
            if new_status in ['under_review', 'resolved', 'dismissed']:
                if not report.reviewed_by:
                    report.reviewed_by = self.request.user
                    from django.utils import timezone
                    report.reviewed_at = timezone.now()
                    report.save()

    @action(detail=False, methods=['get'])
    def my_reports(self, request):
        """Get current user's reports"""
        reports = Report.objects.filter(reporter=request.user)

        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            reports = reports.filter(status=status_filter)

        page = self.paginate_queryset(reports)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(reports, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def mark_under_review(self, request, pk=None):
        """Mark report as under review (admin only)"""
        report = self.get_object()
        report.mark_under_review(request.user)

        return Response(
            ReportDetailSerializer(report).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def resolve(self, request, pk=None):
        """Resolve a report (admin only)"""
        report = self.get_object()
        admin_notes = request.data.get('admin_notes', '')

        report.resolve(request.user, admin_notes)

        return Response(
            {
                'message': 'Report resolved successfully',
                'report': ReportDetailSerializer(report).data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def dismiss(self, request, pk=None):
        """Dismiss a report (admin only)"""
        report = self.get_object()
        admin_notes = request.data.get('admin_notes', '')

        report.dismiss(request.user, admin_notes)

        return Response(
            {
                'message': 'Report dismissed successfully',
                'report': ReportDetailSerializer(report).data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def stats(self, request):
        """Get moderation statistics (admin only)"""
        # Count reports by status
        total_reports = Report.objects.count()
        pending = Report.objects.filter(status='pending').count()
        under_review = Report.objects.filter(status='under_review').count()
        resolved = Report.objects.filter(status='resolved').count()
        dismissed = Report.objects.filter(status='dismissed').count()

        # Count by content type
        reports_by_type = {}
        for content_type, label in Report.CONTENT_TYPES:
            count = Report.objects.filter(content_type=content_type).count()
            if count > 0:
                reports_by_type[label] = count

        # Count by reason
        reports_by_reason = {}
        for reason, label in Report.REASON_CHOICES:
            count = Report.objects.filter(reason=reason).count()
            if count > 0:
                reports_by_reason[label] = count

        stats = {
            'total_reports': total_reports,
            'pending_reports': pending,
            'under_review_reports': under_review,
            'resolved_reports': resolved,
            'dismissed_reports': dismissed,
            'reports_by_type': reports_by_type,
            'reports_by_reason': reports_by_reason,
            'total_actions': ContentAction.objects.count()
        }

        serializer = ModerationStatsSerializer(stats)
        return Response(serializer.data)


class ContentActionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for moderation actions (admin only).

    list: GET /api/moderation-actions/
    create: POST /api/moderation-actions/
    retrieve: GET /api/moderation-actions/{id}/
    """
    queryset = ContentAction.objects.all()
    serializer_class = ContentActionSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['action_type', 'target_user', 'report']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Optimize queryset with select_related"""
        return super().get_queryset().select_related('report', 'target_user', 'admin')

    def perform_create(self, serializer):
        """Create action and execute it"""
        action = serializer.save(admin=self.request.user)

        # Execute the action
        self._execute_action(action)

        # Update report status to resolved
        if action.report:
            action.report.resolve(self.request.user, f"Action taken: {action.get_action_type_display()}")

    def _execute_action(self, action):
        """Execute the moderation action"""
        if action.action_type == 'content_removed':
            # Remove the content
            if action.report.content_type == 'post':
                from apps.forum.models import Post
                try:
                    post = Post.objects.get(id=action.report.content_id)
                    post.is_active = False
                    post.save()
                except Post.DoesNotExist:
                    pass
            elif action.report.content_type == 'comment':
                from apps.forum.models import Comment
                try:
                    comment = Comment.objects.get(id=action.report.content_id)
                    comment.delete()  # Soft delete
                except Comment.DoesNotExist:
                    pass

        elif action.action_type == 'user_suspended':
            action.target_user.is_active = False
            if action.duration_days:
                action.target_user.suspended_until = timezone.now() + datetime.timedelta(days=action.duration_days)
            action.target_user.save()

        elif action.action_type == 'user_banned':
            action.target_user.is_active = False
            action.target_user.suspended_until = None  # Permanent ban
            action.target_user.save()

        # Notify the target user by email
        action_messages = {
            'warning': 'You have received a warning on your Fordham SwipeShare account.',
            'content_removed': 'Content you posted has been removed for violating community guidelines.',
            'user_suspended': f'Your account has been suspended for {action.duration_days or "an unspecified number of"} day(s).',
            'user_banned': 'Your account has been permanently banned.',
            'no_action': 'A report involving your account was reviewed and no action was taken.',
        }
        msg = action_messages.get(action.action_type, 'A moderation action has been taken on your account.')
        send_mail(
            subject='[SwipeShare] Account Notice',
            message=(
                f'Hi {action.target_user.full_name},\n\n'
                f'{msg}\n\n'
                f'Admin notes: {action.notes or "N/A"}\n\n'
                f'If you have questions, contact support.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[action.target_user.email],
            fail_silently=True,
        )
