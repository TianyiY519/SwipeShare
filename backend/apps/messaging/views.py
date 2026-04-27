from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from apps.swipes.models import SwipeListing
from django.contrib.auth import get_user_model

User = get_user_model()


class ConversationViewSet(viewsets.ModelViewSet):
    """
    list:    GET  /api/messaging/conversations/         — my conversations
    create:  POST /api/messaging/conversations/         — start conversation (body: {listing, text} or {receiver, text})
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
        receiver_id = request.data.get('receiver')
        text = request.data.get('text', '').strip()
        source = request.data.get('source', '')

        if not text:
            return Response({'detail': 'text is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Determine the other user
        target_listing = None
        if listing_id:
            try:
                target_listing = SwipeListing.objects.get(id=listing_id)
            except SwipeListing.DoesNotExist:
                return Response({'detail': 'Listing not found'}, status=status.HTTP_404_NOT_FOUND)
            other_user = target_listing.user
        elif receiver_id:
            try:
                other_user = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'detail': 'listing or receiver is required'}, status=status.HTTP_400_BAD_REQUEST)

        if other_user == request.user:
            return Response({'detail': 'Cannot message yourself'}, status=status.HTTP_400_BAD_REQUEST)

        # Reuse any existing conversation between these two users (in either direction)
        conv = Conversation.objects.filter(
            (Q(sender=request.user, receiver=other_user) |
             Q(sender=other_user, receiver=request.user))
        ).first()
        created = False
        if not conv:
            conv = Conversation.objects.create(
                listing=target_listing,
                sender=request.user,
                receiver=other_user,
            )
            created = True

        # Prepend source context so receiver knows where this message came from
        msg_text = f"[From: {source}]\n{text}" if source else text
        Message.objects.create(conversation=conv, author=request.user, text=msg_text)

        serializer = self.get_serializer(conv)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conv = self.get_object()
        # Mark messages from the other person as read
        conv.messages.exclude(author=request.user).filter(is_read=False).update(is_read=True)
        msgs = conv.messages.select_related('author', 'reply_to', 'reply_to__author').all()
        serializer = MessageSerializer(msgs, many=True, context={'request': request})
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        conv = self.get_object()
        if conv.sender != request.user and conv.receiver != request.user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        conv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        conv = self.get_object()
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'text is required'}, status=status.HTTP_400_BAD_REQUEST)

        reply_to_id = request.data.get('reply_to')
        reply_to = None
        if reply_to_id:
            reply_to = conv.messages.filter(id=reply_to_id).first()

        msg = Message.objects.create(conversation=conv, author=request.user, text=text, reply_to=reply_to)
        serializer = MessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
