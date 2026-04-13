from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SwipeListing, SwipeMatch

User = get_user_model()


class SwipeListingUserSerializer(serializers.ModelSerializer):
    """Minimal user serializer for swipe listings"""
    class Meta:
        model = User
        fields = ['id', 'full_name', 'campus', 'profile_picture', 'reliability_score']


class SwipeListingSerializer(serializers.ModelSerializer):
    """
    Serializer for swipe listings (donations and requests).
    """
    user = SwipeListingUserSerializer(read_only=True)
    is_active = serializers.ReadOnlyField()

    class Meta:
        model = SwipeListing
        fields = [
            'id', 'user', 'type', 'campus', 'dining_hall', 'quantity',
            'available_date', 'available_time', 'meeting_location',
            'notes', 'status', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Additional validation"""
        from django.utils import timezone

        # Check if date is in the future
        if attrs.get('available_date') and attrs['available_date'] < timezone.now().date():
            raise serializers.ValidationError({
                'available_date': 'Available date cannot be in the past'
            })

        # Check quantity
        if attrs.get('quantity', 1) <= 0:
            raise serializers.ValidationError({
                'quantity': 'Quantity must be greater than 0'
            })

        return attrs

    def create(self, validated_data):
        """Set user from request context"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SwipeListingDetailSerializer(SwipeListingSerializer):
    """
    Detailed serializer for swipe listing with match information.
    """
    match_count = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta(SwipeListingSerializer.Meta):
        fields = SwipeListingSerializer.Meta.fields + ['match_count', 'can_edit']

    def get_match_count(self, obj):
        """Get number of matches for this listing"""
        if obj.type == 'donation':
            return obj.donation_matches.filter(status='pending').count()
        else:
            return obj.request_matches.filter(status='pending').count()

    def get_can_edit(self, obj):
        """Check if current user can edit this listing"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.user == request.user


class SwipeMatchSerializer(serializers.ModelSerializer):
    """
    Serializer for swipe matches.
    """
    donor = SwipeListingUserSerializer(read_only=True)
    requester = SwipeListingUserSerializer(read_only=True)
    donation_listing = SwipeListingSerializer(read_only=True)
    request_listing = SwipeListingSerializer(read_only=True)

    class Meta:
        model = SwipeMatch
        fields = [
            'id', 'donation_listing', 'request_listing', 'donor', 'requester',
            'firebase_conversation_id', 'status', 'completed_at',
            'donor_confirmed', 'requester_confirmed', 'created_at'
        ]
        read_only_fields = [
            'id', 'donor', 'requester', 'firebase_conversation_id',
            'status', 'completed_at', 'created_at'
        ]


class CreateMatchSerializer(serializers.Serializer):
    """
    Serializer for creating a match between donation and request.
    """
    request_listing_id = serializers.IntegerField(required=True)

    def validate_request_listing_id(self, value):
        """Validate that request listing exists and is available"""
        try:
            listing = SwipeListing.objects.get(id=value, type='request', status='open')
        except SwipeListing.DoesNotExist:
            raise serializers.ValidationError("Request listing not found or not available")
        return value

    def validate(self, attrs):
        """Validate match can be created"""
        donation_listing = self.context['donation_listing']
        request_listing = SwipeListing.objects.get(id=attrs['request_listing_id'])

        # Check if users are different
        if donation_listing.user == request_listing.user:
            raise serializers.ValidationError("Cannot match with your own listing")

        # Check campus match
        if donation_listing.campus != request_listing.campus:
            raise serializers.ValidationError("Listings must be on the same campus")

        # Check if match already exists
        existing_match = SwipeMatch.objects.filter(
            donation_listing=donation_listing,
            request_listing=request_listing,
            status='pending'
        ).exists()

        if existing_match:
            raise serializers.ValidationError("Match already exists for these listings")

        attrs['request_listing'] = request_listing
        return attrs

    def create(self, validated_data):
        """Create the match"""
        donation_listing = self.context['donation_listing']
        request_listing = validated_data['request_listing']

        # Create match
        match = SwipeMatch.objects.create(
            donation_listing=donation_listing,
            request_listing=request_listing,
            donor=donation_listing.user,
            requester=request_listing.user
        )

        # Update listing statuses to pending
        donation_listing.status = 'pending'
        donation_listing.save()
        request_listing.status = 'pending'
        request_listing.save()

        return match


class ConfirmMatchSerializer(serializers.Serializer):
    """
    Serializer for confirming match completion.
    """
    def validate(self, attrs):
        """Check if user is part of the match"""
        match = self.context['match']
        user = self.context['request'].user

        if user not in [match.donor, match.requester]:
            raise serializers.ValidationError("You are not part of this match")

        if match.status != 'pending':
            raise serializers.ValidationError("Match is not in pending status")

        return attrs

    def save(self):
        """Confirm the match"""
        match = self.context['match']
        user = self.context['request'].user

        # Set confirmation based on user role
        if user == match.donor:
            match.donor_confirmed = True
        elif user == match.requester:
            match.requester_confirmed = True

        match.save()

        # If both confirmed, complete the match
        if match.donor_confirmed and match.requester_confirmed:
            match.complete_match()

        return match


class SwipeStatsSerializer(serializers.Serializer):
    """
    Serializer for swipe statistics.
    """
    total_donations = serializers.IntegerField()
    total_requests = serializers.IntegerField()
    active_listings = serializers.IntegerField()
    completed_matches = serializers.IntegerField()
    pending_matches = serializers.IntegerField()
