from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from apps.swipes.models import SwipeListing


class ConversationViewSet(viewsets.ModelViewSet):
    """
    list:    GET  /api/messaging/conversations/         — my conversations
    create:  POST /api/messaging/conversations/         — start conversation (body: {listing, text})
    retrieve: GET /api/messaging/conversations/{id}/    — conversation detail
    messages: GET /api/messaging/conversations/{id}/messages/
    reply:   POST /api/messaging/conversations/{id}/reply/  — send message
    """
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).select_related('sender', 'receiver', 'listing')

    def create(self, request):
        listing_id = request.data.get('listing')
        text = request.data.get('text', '').strip()
        if not listing_id or not text:
            return Response({'detail': 'listing and text are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            listing = SwipeListing.objects.get(id=listing_id)
        except SwipeListing.DoesNotExist:
            return Response({'detail': 'Listing not found'}, status=status.HTTP_404_NOT_FOUND)

        if listing.user == request.user:
            return Response({'detail': 'Cannot message yourself'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create conversation
        conv, created = Conversation.objects.get_or_create(
            listing=listing,
            sender=request.user,
            defaults={'receiver': listing.user},
        )

        Message.objects.create(conversation=conv, author=request.user, text=text)

        serializer = self.get_serializer(conv)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conv = self.get_object()
        # Mark messages from the other person as read
        conv.messages.exclude(author=request.user).filter(is_read=False).update(is_read=True)
        msgs = conv.messages.select_related('author').all()
        serializer = MessageSerializer(msgs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        conv = self.get_object()
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'text is required'}, status=status.HTTP_400_BAD_REQUEST)

        msg = Message.objects.create(conversation=conv, author=request.user, text=text)
        serializer = MessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
