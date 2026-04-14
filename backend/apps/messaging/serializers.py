from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    is_mine = serializers.SerializerMethodField()
    reply_to_data = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'author', 'author_name', 'text', 'reply_to', 'reply_to_data', 'is_read', 'is_mine', 'created_at']
        read_only_fields = ['id', 'author', 'author_name', 'is_read', 'is_mine', 'created_at']

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return request and obj.author_id == request.user.id

    def get_reply_to_data(self, obj):
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'text': obj.reply_to.text[:80],
                'author_name': obj.reply_to.author.full_name,
            }
        return None


class ConversationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.full_name', read_only=True)
    listing_type = serializers.CharField(source='listing.type', read_only=True, default=None)
    listing_campus = serializers.CharField(source='listing.campus', read_only=True, default=None)
    listing_date = serializers.DateField(source='listing.available_date', read_only=True, default=None)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'listing', 'sender', 'sender_name', 'receiver', 'receiver_name',
            'listing_type', 'listing_campus', 'listing_date',
            'last_message', 'unread_count', 'created_at',
        ]
        read_only_fields = ['id', 'sender', 'receiver', 'created_at']

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return {'text': msg.text, 'author_name': msg.author.full_name, 'created_at': msg.created_at}
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(author=request.user).count()
