import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

interface Listing {
  id: number;
  user: { id: number; full_name: string; campus: string };
  type: 'donation' | 'request';
  available_date: string;
  available_time: string;
  quantity: number;
  campus: string;
  meeting_location: string;
  notes: string;
  status: string;
  created_at: string;
}

export default function SwipesScreen({ navigation }: any) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'donation' | 'request'>('all');
  const [campus, setCampus] = useState<'all' | 'RH' | 'LC'>('all');

  const load = useCallback(async () => {
    try {
      const params: any = { active: 'true' };
      if (filter !== 'all') params.type = filter;
      if (campus !== 'all') params.campus = campus;
      const res = await api.get('/api/swipes/listings/', { params });
      setListings(res.data.results || res.data);
    } catch {} finally { setLoading(false); }
  }, [filter, campus]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }: { item: Listing }) => {
    const isDonation = item.type === 'donation';
    return (
      <TouchableOpacity style={s.card} onPress={() => navigation.navigate('SwipeDetail', { listing: item })} activeOpacity={0.7}>
        <View style={s.cardHeader}>
          <View style={[s.badge, { backgroundColor: isDonation ? '#e8f5e9' : '#e3f2fd' }]}>
            <Text style={[s.badgeText, { color: isDonation ? '#2e7d32' : '#1565c0' }]}>
              {isDonation ? 'Donation' : 'Request'}
            </Text>
          </View>
          <Text style={s.qty}>{item.quantity} swipe{item.quantity !== 1 ? 's' : ''}</Text>
        </View>
        <Text style={s.meta}>
          {item.campus === 'RH' ? 'Rose Hill' : 'Lincoln Center'} · {item.available_date}{item.available_time ? ` · ~${item.available_time.slice(0, 5)}` : ''}
        </Text>
        {item.meeting_location ? <Text style={s.location}>📍 {item.meeting_location}</Text> : null}
        <Text style={s.author}>by {item.user.full_name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.filters}>
        {(['all', 'donation', 'request'] as const).map((f) => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterActiveText]}>
              {f === 'all' ? 'All' : f === 'donation' ? 'Donations' : 'Requests'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.filters}>
        {(['all', 'RH', 'LC'] as const).map((c) => (
          <TouchableOpacity key={c} style={[s.filterBtn, s.filterSmall, campus === c && s.filterActive]} onPress={() => setCampus(c)}>
            <Text style={[s.filterText, s.filterSmallText, campus === c && s.filterActiveText]}>
              {c === 'all' ? 'Both' : c === 'RH' ? 'Rose Hill' : 'Lincoln Ctr'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#800000" />}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          loading ? null : <Text style={s.empty}>No listings found</Text>
        }
      />

      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateSwipe')} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filters: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  filterBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
  },
  filterSmall: { paddingVertical: 6, paddingHorizontal: 12 },
  filterActive: { backgroundColor: '#800000', borderColor: '#800000' },
  filterText: { fontSize: 14, color: '#555', fontWeight: '500' },
  filterSmallText: { fontSize: 12 },
  filterActiveText: { color: '#fff' },
  list: { padding: 12, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  qty: { fontSize: 14, fontWeight: '700', color: '#800000' },
  meta: { fontSize: 13, color: '#777', marginTop: 4 },
  location: { fontSize: 13, color: '#555', marginTop: 4 },
  author: { fontSize: 12, color: '#999', marginTop: 8 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#800000', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
  },
});
