from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
import secrets

from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileUpdateSerializer,
    PasswordChangeSerializer,
    EmailVerificationSerializer,
    UserStatsSerializer
)

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """
    Register a new user with email verification.
    POST /api/auth/register/
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate verification token
        verification_token = secrets.token_urlsafe(32)
        user.email_verification_token = verification_token
        user.save()

        # Send verification email
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        send_mail(
            subject='Verify your Fordham SwipeShare account',
            message=f'Click the link to verify your email: {verification_url}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({
            'message': 'Registration successful. Please check your email to verify your account.',
            'email': user.email
        }, status=status.HTTP_201_CREATED)


class EmailVerificationView(APIView):
    """
    Verify user email with token.
    POST /api/auth/verify-email/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        user = User.objects.get(email_verification_token=token)
        user.is_email_verified = True
        user.email_verification_token = None
        user.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Email verified successfully',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    """
    Resend verification email.
    POST /api/auth/resend-verification/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email.lower())
            if user.is_email_verified:
                return Response(
                    {'message': 'Email is already verified'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate new verification token
            verification_token = secrets.token_urlsafe(32)
            user.email_verification_token = verification_token
            user.save()

            # Send verification email
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
            send_mail(
                subject='Verify your Fordham SwipeShare account',
                message=f'Click the link to verify your email: {verification_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

            return Response({
                'message': 'Verification email sent successfully'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    Get or update current user profile.
    GET /api/auth/me/
    PUT /api/auth/me/
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserProfileUpdateSerializer
        return UserSerializer


class PasswordChangeView(APIView):
    """
    Change user password.
    POST /api/auth/change-password/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class UserStatsView(generics.RetrieveAPIView):
    """
    Get current user statistics.
    GET /api/auth/stats/
    """
    serializer_class = UserStatsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserProfileView(generics.RetrieveAPIView):
    """
    Get public user profile by ID.
    GET /api/users/{id}/
    """
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class AdminUserListView(generics.ListAPIView):
    """
    List all users (admin only).
    GET /api/auth/admin/users/
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        search = self.request.query_params.get('search', '')
        if search:
            from django.db.models import Q
            qs = qs.filter(Q(email__icontains=search) | Q(full_name__icontains=search) | Q(username__icontains=search))
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs


class AdminUserToggleActiveView(APIView):
    """
    Toggle user active status (suspend/unsuspend/ban).
    POST /api/auth/admin/users/{id}/toggle-active/
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'suspend', 'ban', 'activate'
        if action == 'suspend':
            days = int(request.data.get('duration_days', 7))
            from django.utils import timezone
            import datetime
            target.is_active = False
            target.suspended_until = timezone.now() + datetime.timedelta(days=days)
            target.save()
            return Response({'message': f'User suspended for {days} days'})
        elif action == 'ban':
            target.is_active = False
            target.suspended_until = None
            target.save()
            return Response({'message': 'User banned permanently'})
        elif action == 'activate':
            target.is_active = True
            target.suspended_until = None
            target.save()
            return Response({'message': 'User activated'})
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Custom login view that checks email verification.
    POST /api/auth/login/
    """
    from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email.lower())
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Auto-lift expired suspensions
    if not user.is_active and user.suspended_until:
        from django.utils import timezone
        if timezone.now() >= user.suspended_until:
            user.is_active = True
            user.suspended_until = None
            user.save()

    if not user.is_active:
        suspended_msg = (
            f'Your account is suspended until {user.suspended_until.strftime("%Y-%m-%d %H:%M")} UTC.'
            if user.suspended_until else 'Your account has been banned.'
        )
        return Response({'error': suspended_msg}, status=status.HTTP_403_FORBIDDEN)

    if not user.is_email_verified:
        return Response(
            {'error': 'Please verify your email before logging in'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Generate tokens
    refresh = RefreshToken.for_user(user)

    # Track last login
    from django.utils import timezone as tz
    user.last_login = tz.now()
    user.save(update_fields=['last_login'])

    return Response({
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        },
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Logout by blacklisting the refresh token.
    POST /api/auth/logout/
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def whats_new(request):
    """
    Return all unseen/unread notifications.
    Items stay until the user actually checks them:
      - Messages: unread (cleared when user opens the chat)
      - Comments on your posts: unseen (cleared when you open the post)
      - Likes on your posts: unseen (cleared when you open the post)
    GET /api/auth/whats-new/
    """
    from django.db.models import Q

    user = request.user
    items = []

    # Unread messages (cleared when user opens chat via /messages/ endpoint)
    from apps.messaging.models import Message, Conversation
    my_convs = Conversation.objects.filter(Q(sender=user) | Q(receiver=user))
    unread_msgs = Message.objects.filter(
        conversation__in=my_convs, is_read=False
    ).exclude(author=user).select_related('author', 'conversation').order_by('-created_at')[:20]
    # Group by conversation so we don't show duplicate per-message entries
    seen_convs = set()
    for m in unread_msgs:
        cid = m.conversation_id
        if cid in seen_convs:
            continue
        seen_convs.add(cid)
        items.append({
            'type': 'message',
            'text': f'{m.author.full_name} sent you a message',
            'detail': m.text[:80],
            'conversation_id': cid,
            'created_at': m.created_at.isoformat(),
        })

    # Unseen comments on my posts (cleared when post owner opens their post)
    from apps.forum.models import Comment, PostLike
    unseen_comments = Comment.objects.filter(
        post__user=user, is_deleted=False, is_seen_by_post_owner=False
    ).exclude(user=user).select_related('user', 'post').order_by('-created_at')[:20]
    for c in unseen_comments:
        items.append({
            'type': 'comment',
            'text': f'{c.user.full_name} commented on "{c.post.title}"',
            'detail': c.content[:80],
            'post_id': c.post_id,
            'created_at': c.created_at.isoformat(),
        })

    # Unseen likes on my posts — grouped by post
    unseen_likes = PostLike.objects.filter(
        post__user=user, is_seen_by_post_owner=False
    ).exclude(user=user).select_related('user', 'post').order_by('-created_at')
    likes_by_post: dict = {}
    for lk in unseen_likes:
        pid = lk.post_id
        if pid not in likes_by_post:
            likes_by_post[pid] = {'title': lk.post.title, 'count': 0, 'latest': lk.created_at}
        likes_by_post[pid]['count'] += 1
        if lk.created_at > likes_by_post[pid]['latest']:
            likes_by_post[pid]['latest'] = lk.created_at
    for info in likes_by_post.values():
        n = info['count']
        people = '1 person' if n == 1 else f'{n} people'
        items.append({
            'type': 'like',
            'text': f'{people} liked your post: {info["title"]}',
            'detail': '',
            'post_id': pid,
            'created_at': info['latest'].isoformat(),
        })

    # Sort all by created_at descending
    items.sort(key=lambda x: x['created_at'], reverse=True)

    return Response({'items': items[:30]})
