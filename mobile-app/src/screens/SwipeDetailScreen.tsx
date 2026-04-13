import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, TextInput, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import api from '../api';
import ReportModal from './ReportModal';

export default function SwipeDetailScreen({ route, navigation }: any) {
  const { listing } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [showReport, setShowReport] = useState(false);
  const isOwner = !!user && listing.user.id == user.id;
  const isDonation = listing.type === 'donation';

  // Chat state
  const [allConvs, setAllConvs] = useState<any[]>([]);   // owner: all convs on listing
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState('');
  const [chatLoading, setChatLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isDonation && !isOwner) {
      api.get('/api/swipes/listings/', { params: { type: 'request', active: 'true' } })
        .then((res) => {
          const mine = (res.data.results || res.data).filter((l: any) => l.user.id === user?.id);
          setMyRequests(mine);
        })
        .catch(() => {});
    }
  }, []);

  // Load existing conversations for this listing
  useEffect(() => {
    api.get('/api/messaging/conversations/').then((res) => {
      const all = res.data.results || res.data;
      const listingConvs = all.filter((c: any) => c.listing === listing.id);
      if (isOwner) {
        setAllConvs(listingConvs);
        if (listingConvs.length === 1) {
          setConversation(listingConvs[0]);
          loadMessages(listingConvs[0].id);
        }
      } else {
        const existing = listingConvs.find((c: any) => c.sender === user?.id);
        if (existing) {
          setConversation(existing);
          loadMessages(existing.id);
        }
      }
    }).catch(() => {}).finally(() => setChatLoading(false));
  }, []);

  const openConv = async (conv: any) => {
    setConversation(conv);
    await loadMessages(conv.id);
  };

  const loadMessages = async (convId: number) => {
    try {
      const res = await api.get(`/api/messaging/conversations/${convId}/messages/`);
      setMessages(res.data);
    } catch {}
  };

  const startConversation = async () => {
    try {
      const res = await api.post('/api/messaging/conversations/', {
        listing: listing.id,
        text: chatText.trim() || 'Hi! I\'m interested in this swipe.',
      });
      setConversation(res.data);
      setChatText('');
      loadMessages(res.data.id);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Could not start conversation');
    }
  };

  const sendMessage = async () => {
    if (!chatText.trim() || sending || !conversation) return;
    try {
      setSending(true);
      const res = await api.post(`/api/messaging/conversations/${conversation.id}/reply/`, { text: chatText.trim() });
      setMessages((prev) => [...prev, res.data]);
      setChatText('');
    } catch {} finally { setSending(false); }
  };

  const handleMatch = async (requestId: number) => {
    try {
      setLoading(true);
      await api.post(`/api/swipes/listings/${listing.id}/match/`, { request_listing_id: requestId });
      Alert.alert('Matched!', 'You have been matched successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete Listing', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/api/swipes/listings/${listing.id}/`);
            navigation.goBack();
          } catch {}
        },
      },
    ]);
  };

  const otherName = isOwner
    ? (conversation?.sender_name || 'Student')
    : listing.user.full_name;

  return (
    <ScrollView style={s.container}>
      <View style={s.card}>
        <View style={[s.typeBanner, { backgroundColor: isDonation ? '#2e7d32' : '#1565c0' }]}>
          <Ionicons name={isDonation ? 'heart' : 'restaurant'} size={20} color="#fff" />
          <Text style={s.typeText}>{isDonation ? 'Donation' : 'Request'}</Text>
        </View>

        <View style={s.body}>
          <InfoRow icon="calendar" label="Date" value={listing.available_date} />
          {listing.available_time && <InfoRow icon="time" label="Around" value={`~${listing.available_time.slice(0, 5)}`} />}
          <InfoRow icon="layers" label="Quantity" value={`${listing.quantity} swipe${listing.quantity !== 1 ? 's' : ''}`} />
          <InfoRow icon="location" label="Campus" value={listing.campus === 'RH' ? 'Rose Hill' : 'Lincoln Center'} />
          {listing.meeting_location && <InfoRow icon="navigate" label="Meet At" value={listing.meeting_location} />}
          {listing.notes && <InfoRow icon="document-text" label="Notes" value={listing.notes} />}
          <InfoRow icon="person" label="Posted By" value={listing.user.full_name} />
          <InfoRow icon="checkmark-circle" label="Status" value={listing.status} />
        </View>
      </View>

      {isDonation && !isOwner && myRequests.length > 0 && (
        <View style={s.matchSection}>
          <Text style={s.matchTitle}>Match with your request:</Text>
          {myRequests.map((r) => (
            <TouchableOpacity key={r.id} style={s.matchBtn} onPress={() => handleMatch(r.id)} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text style={s.matchBtnText}>{r.available_date} · {r.quantity} swipe{r.quantity !== 1 ? 's' : ''}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Chat section */}
      {!chatLoading && isOwner && allConvs.length > 0 && !conversation && (
        <View style={s.chatCard}>
          <View style={s.chatHeader}>
            <Ionicons name="chatbubbles" size={16} color="#fff" />
            <Text style={s.chatHeaderText}>Messages ({allConvs.length})</Text>
          </View>
          {allConvs.map((conv) => (
            <TouchableOpacity key={conv.id} style={s.convItem} onPress={() => openConv(conv)} activeOpacity={0.7}>
              <View style={s.convAvatar}>
                <Ionicons name="person" size={20} color="#800000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.convName}>{conv.sender_name || 'Student'}</Text>
                {conv.last_message?.text ? (
                  <Text style={s.convPreview} numberOfLines={1}>{conv.last_message.text}</Text>
                ) : null}
              </View>
              {conv.unread_count > 0 && (
                <View style={s.convBadge}>
                  <Text style={s.convBadgeText}>{conv.unread_count}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!chatLoading && conversation && (
        <View style={s.chatCard}>
          <View style={s.chatHeader}>
            {isOwner && allConvs.length > 1 && (
              <TouchableOpacity onPress={() => { setConversation(null); setMessages([]); }} style={{ marginRight: 4 }}>
                <Ionicons name="arrow-back" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            <Ionicons name="chatbubble" size={16} color="#fff" />
            <Text style={s.chatHeaderText}>Chat with {otherName}</Text>
          </View>
          <View style={s.chatMessages}>
            {messages.length === 0 ? (
              <Text style={s.chatEmpty}>No messages yet</Text>
            ) : (
              messages.map((m) => (
                <View key={m.id} style={[s.bubble, m.is_mine ? s.mine : s.theirs]}>
                  <Text style={[s.bubbleText, m.is_mine && s.mineText]}>{m.text}</Text>
                  <Text style={[s.bubbleTime, m.is_mine && s.mineTime]}>
                    {m.author_name} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))
            )}
          </View>
          <View style={s.chatInputRow}>
            <TextInput
              style={s.chatInput}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={chatText}
              onChangeText={setChatText}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={sendMessage} disabled={sending || !chatText.trim()}>
              <Ionicons name="send" size={22} color={chatText.trim() ? '#800000' : '#ccc'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!chatLoading && !conversation && !isOwner && (
        <View style={s.chatCard}>
          <View style={s.chatHeader}>
            <Ionicons name="chatbubble-outline" size={16} color="#fff" />
            <Text style={s.chatHeaderText}>Message {listing.user.full_name}</Text>
          </View>
          <View style={s.chatInputRow}>
            <TextInput
              style={s.chatInput}
              placeholder="Write a message to get started..."
              placeholderTextColor="#999"
              value={chatText}
              onChangeText={setChatText}
              onSubmitEditing={startConversation}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={startConversation} disabled={!chatText.trim()}>
              <Ionicons name="send" size={22} color={chatText.trim() ? '#800000' : '#ccc'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {(isOwner || user?.is_staff) && (
        <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash" size={18} color="#c62828" />
          <Text style={s.deleteBtnText}>Delete Listing</Text>
        </TouchableOpacity>
      )}

      {!isOwner && (
        <TouchableOpacity style={s.reportBtn} onPress={() => setShowReport(true)}>
          <Ionicons name="flag-outline" size={18} color="#e65100" />
          <Text style={s.reportBtnText}>Report Listing</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />

      <ReportModal
        visible={showReport}
        contentType="swipe_listing"
        contentId={listing.id}
        onClose={() => setShowReport(false)}
      />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon as any} size={18} color="#800000" style={{ marginTop: 1 }} />
      <View style={s.infoText}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { margin: 16, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 3 },
  typeBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, paddingHorizontal: 18 },
  typeText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  body: { padding: 18 },
  infoRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#333', fontWeight: '500' },
  matchSection: { marginHorizontal: 16, marginTop: 8 },
  matchTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  matchBtn: {
    backgroundColor: '#2e7d32', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8,
  },
  matchBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 16, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#c62828',
  },
  deleteBtnText: { color: '#c62828', fontSize: 15, fontWeight: '600' },
  // Chat
  chatCard: {
    margin: 16, marginTop: 8, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2,
  },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingHorizontal: 16,
    backgroundColor: '#800000',
  },
  chatHeaderText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  chatMessages: { padding: 12, maxHeight: 250 },
  chatEmpty: { color: '#999', textAlign: 'center', padding: 12, fontSize: 13 },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 14, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#800000', borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#e8e8e8', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: '#333', lineHeight: 19 },
  mineText: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: '#999', marginTop: 4 },
  mineTime: { color: 'rgba(255,255,255,0.7)' },
  chatInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  chatInput: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, fontSize: 14, color: '#333',
  },
  convItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  convAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5e6e6',
    alignItems: 'center', justifyContent: 'center',
  },
  convName: { fontSize: 14, fontWeight: '600', color: '#333' },
  convPreview: { fontSize: 12, color: '#888', marginTop: 2 },
  convBadge: {
    backgroundColor: '#c62828', borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginRight: 4,
  },
  convBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 16, marginTop: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e65100',
  },
  reportBtnText: { color: '#e65100', fontSize: 15, fontWeight: '600' },
});
