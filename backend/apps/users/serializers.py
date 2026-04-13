from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Standard user serializer for displaying user information.
    """
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'fordham_id',
            'campus', 'profile_picture', 'bio', 'phone_number',
            'swipes_donated', 'swipes_received', 'reliability_score',
            'is_email_verified', 'is_staff', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'swipes_donated', 'swipes_received', 'reliability_score',
            'is_email_verified', 'is_staff', 'created_at', 'updated_at'
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with password confirmation.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'full_name', 'campus', 'phone_number'
        ]

    def validate_email(self, value):
        """Ensure email is from Fordham domain"""
        if not value.endswith('@fordham.edu'):
            raise serializers.ValidationError(
                "Email must be a valid @fordham.edu address"
            )
        return value.lower()

    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password_confirm": "Passwords do not match"
            })
        return attrs

    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile information.
    """
    class Meta:
        model = User
        fields = [
            'full_name', 'campus', 'profile_picture', 'bio',
            'phone_number', 'fcm_token'
        ]

    def validate_phone_number(self, value):
        """Validate phone number format"""
        if value and not value.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only digits, spaces, hyphens, or a leading +"
            )
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for changing user password.
    """
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate_old_password(self, value):
        """Validate old password is correct"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value

    def validate(self, attrs):
        """Validate that new passwords match"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password_confirm": "New passwords do not match"
            })
        return attrs

    def save(self):
        """Update user password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class EmailVerificationSerializer(serializers.Serializer):
    """
    Serializer for email verification.
    """
    token = serializers.CharField(required=True)

    def validate_token(self, value):
        """Validate verification token exists and is valid"""
        try:
            user = User.objects.get(email_verification_token=value)
            if user.is_email_verified:
                raise serializers.ValidationError("Email is already verified")
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token")
        return value


class UserStatsSerializer(serializers.ModelSerializer):
    """
    Serializer for user statistics and activity.
    """
    total_swipes_exchanged = serializers.SerializerMethodField()
    active_listings_count = serializers.SerializerMethodField()
    active_matches_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'campus', 'swipes_donated',
            'swipes_received', 'reliability_score', 'total_swipes_exchanged',
            'active_listings_count', 'active_matches_count', 'posts_count'
        ]

    def get_total_swipes_exchanged(self, obj):
        return obj.swipes_donated + obj.swipes_received

    def get_active_listings_count(self, obj):
        return obj.listings.filter(status='open').count()

    def get_active_matches_count(self, obj):
        from django.db.models import Q
        return obj.donations.filter(status='pending').count() + \
               obj.requests.filter(status='pending').count()

    def get_posts_count(self, obj):
        return obj.posts.filter(is_active=True).count()
