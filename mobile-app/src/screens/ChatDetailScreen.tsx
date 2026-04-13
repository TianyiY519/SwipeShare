import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

export default function ChatDetailScreen({ route }: any) {
  const { conversation } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/api/messaging/conversations/${conversation.id}/messages/`);
      setMessages(res.data);
    } catch {} finally { setLoading(false); }
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    try {
      setSending(true);
      const res = await api.post(`/api/messaging/conversations/${conversation.id}/reply/`, { text: text.trim() });
      setMessages((prev) => [...prev, res.data]);
      setText('');
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch {} finally { setSending(false); }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[s.bubble, item.is_mine ? s.mine : s.theirs]}>
      <Text style={[s.bubbleText, item.is_mine && s.mineText]}>{item.text}</Text>
      <Text style={[s.time, item.is_mine && s.mineTime]}>
        {item.author_name} · {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {loading ? (
        <View style={s.center}><ActivityIndicator color="#800000" size="large" /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={s.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={s.empty}>No messages yet — say hi!</Text>}
        />
      )}
      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity style={s.sendBtn} onPress={send} disabled={sending || !text.trim()}>
          <Ionicons name="send" size={20} color={text.trim() ? '#800000' : '#ccc'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12, paddingBottom: 8 },
  bubble: { maxWidth: '78%', padding: 10, borderRadius: 14, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#800000', borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#e8e8e8', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: '#333', lineHeight: 20 },
  mineText: { color: '#fff' },
  time: { fontSize: 10, color: '#999', marginTop: 4 },
  mineTime: { color: 'rgba(255,255,255,0.7)' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
  },
  input: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, color: '#333',
  },
  sendBtn: { padding: 8 },
});
