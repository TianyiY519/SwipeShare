from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404

from .models import SwipeListing, SwipeMatch
from .serializers import (
    SwipeListingSerializer,
    SwipeListingDetailSerializer,
    SwipeMatchSerializer,
    CreateMatchSerializer,
    ConfirmMatchSerializer,
    SwipeStatsSerializer
)


class SwipeListingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for swipe listings (donations and requests).

    list: GET /api/swipes/
    create: POST /api/swipes/
    retrieve: GET /api/swipes/{id}/
    update: PUT /api/swipes/{id}/
    partial_update: PATCH /api/swipes/{id}/
    destroy: DELETE /api/swipes/{id}/
    my_listings: GET /api/swipes/my-listings/
    create_match: POST /api/swipes/{id}/match/
    """
    queryset = SwipeListing.objects.all()
    serializer_class = SwipeListingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['type', 'campus', 'status']
    ordering_fields = ['created_at', 'available_date']
    ordering = ['-created_at']
    search_fields = ['dining_hall', 'notes']

    def get_serializer_class(self):
        """Use detailed serializer for retrieve action"""
        if self.action == 'retrieve':
            return SwipeListingDetailSerializer
        return SwipeListingSerializer

    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()

        # Filter by active status by default
        if self.action == 'list':
            only_active = self.request.query_params.get('active', 'true')
            if only_active.lower() == 'true':
                queryset = queryset.filter(status='open')

        # Exclude current user's listings
        exclude_mine = self.request.query_params.get('exclude_mine', 'false')
        if exclude_mine.lower() == 'true':
            queryset = queryset.exclude(user=self.request.user)

        return queryset.select_related('user')

    def perform_create(self, serializer):
        """Set user when creating listing"""
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Only allow owner to update"""
        if serializer.instance.user != self.request.user:
            raise permissions.PermissionDenied("You can only update your own listings")
        serializer.save()

    def perform_destroy(self, instance):
        """Only allow owner to delete, and only if status is open"""
        if instance.user != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own listings")
        if instance.status != 'open':
            raise permissions.PermissionDenied("Cannot delete listing that is not open")
        instance.status = 'cancelled'
        instance.save()

    @action(detail=False, methods=['get'])
    def my_listings(self, request):
        """Get current user's listings"""
        listings = self.get_queryset().filter(user=request.user)

        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            listings = listings.filter(status=status_filter)

        page = self.paginate_queryset(listings)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(listings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def match(self, request, pk=None):
        """
        Create a match between a donation listing and a request listing.
        POST /api/swipes/{donation_id}/match/
        Body: {"request_listing_id": 123}
        """
        donation_listing = self.get_object()

        # Validate this is a donation listing
        if donation_listing.type != 'donation':
            return Response(
                {'error': 'Can only create matches for donation listings'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate user is not the donor
        if donation_listing.user == request.user:
            return Response(
                {'error': 'Cannot match with your own listing'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create match
        serializer = CreateMatchSerializer(
            data=request.data,
            context={'donation_listing': donation_listing, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        match = serializer.save()

        return Response(
            SwipeMatchSerializer(match).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get swipe statistics for current user"""
        user = request.user

        available_donations = user.listings.filter(type='donation', status='open').aggregate(
            total=Sum('quantity'))['total'] or 0
        available_requests = user.listings.filter(type='request', status='open').aggregate(
            total=Sum('quantity'))['total'] or 0
        completed_donations = user.donations.filter(status='completed').count()
        completed_requests = user.requests.filter(status='completed').count()

        stats = {
            'total_donations': available_donations,
            'total_requests': available_requests,
            'active_listings': user.listings.filter(status='open').count(),
            'completed_matches': completed_donations + completed_requests,
            'pending_matches': user.donations.filter(status='pending').count() +
                              user.requests.filter(status='pending').count(),
        }

        serializer = SwipeStatsSerializer(stats)
        return Response(serializer.data)


class SwipeMatchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for swipe matches (read-only).

    list: GET /api/matches/
    retrieve: GET /api/matches/{id}/
    my_matches: GET /api/matches/my-matches/
    confirm: POST /api/matches/{id}/confirm/
    cancel: POST /api/matches/{id}/cancel/
    """
    queryset = SwipeMatch.objects.all()
    serializer_class = SwipeMatchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'completed_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only show matches where user is involved"""
        return super().get_queryset().filter(
            Q(donor=self.request.user) | Q(requester=self.request.user)
        ).select_related(
            'donor', 'requester', 'donation_listing', 'request_listing'
        )

    @action(detail=False, methods=['get'])
    def my_matches(self, request):
        """Get current user's matches with filtering"""
        matches = self.get_queryset()

        # Filter by role
        role = request.query_params.get('role')
        if role == 'donor':
            matches = matches.filter(donor=request.user)
        elif role == 'requester':
            matches = matches.filter(requester=request.user)

        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            matches = matches.filter(status=status_filter)

        page = self.paginate_queryset(matches)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(matches, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        Confirm match completion.
        POST /api/matches/{id}/confirm/
        """
        match = self.get_object()

        serializer = ConfirmMatchSerializer(
            data={},
            context={'match': match, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        updated_match = serializer.save()

        response_data = SwipeMatchSerializer(updated_match).data

        if updated_match.status == 'completed':
            response_data['message'] = 'Match completed successfully!'
        else:
            response_data['message'] = 'Confirmation recorded. Waiting for other party to confirm.'

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a match.
        POST /api/matches/{id}/cancel/
        """
        match = self.get_object()

        # Check if user is part of the match
        if request.user not in [match.donor, match.requester]:
            return Response(
                {'error': 'You are not part of this match'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if match can be cancelled
        if match.status != 'pending':
            return Response(
                {'error': 'Can only cancel pending matches'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cancel the match
        match.cancel_match()

        return Response(
            {
                'message': 'Match cancelled successfully',
                'match': SwipeMatchSerializer(match).data
            },
            status=status.HTTP_200_OK
        )
