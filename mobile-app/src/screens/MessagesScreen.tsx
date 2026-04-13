import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function MessagesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/messaging/conversations/');
      setConvs(res.data.results || res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const deleteConv = (convId: number) => {
    Alert.alert('Delete', 'Delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/messaging/conversations/${convId}/`);
          setConvs((prev) => prev.filter((c) => c.id !== convId));
        } catch {}
      }},
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const otherName = item.sender === user?.id ? item.receiver_name : item.sender_name;
    return (
      <TouchableOpacity style={s.card} onPress={() => navigation.navigate('ChatDetail', { conversation: item })}
        onLongPress={() => deleteConv(item.id)} activeOpacity={0.7}>
        <View style={s.cardRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{otherName?.charAt(0) || '?'}</Text>
          </View>
          <View style={s.cardBody}>
            <View style={s.cardTop}>
              <Text style={s.name} numberOfLines={1}>{otherName}</Text>
              {item.unread_count > 0 && (
                <View style={s.unreadBadge}>
                  <Text style={s.unreadText}>{item.unread_count}</Text>
                </View>
              )}
            </View>
            <Text style={s.preview} numberOfLines={1}>
              {item.last_message?.text || 'No messages yet'}
            </Text>
            <Text style={s.meta}>
              {item.listing_type === 'donation' ? 'Donation' : 'Request'} · {item.listing_date}
            </Text>
          </View>
          <TouchableOpacity onPress={() => deleteConv(item.id)} style={s.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      {loading ? (
        <View style={s.center}><ActivityIndicator color="#800000" size="large" /></View>
      ) : (
        <FlatList
          data={convs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No messages yet</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#800000',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1 },
  preview: { fontSize: 13, color: '#777', marginTop: 2 },
  meta: { fontSize: 11, color: '#aaa', marginTop: 2 },
  unreadBadge: {
    backgroundColor: '#800000', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 8,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  deleteBtn: { padding: 8 },
});
