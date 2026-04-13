import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import api from '../api';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<'listings' | 'posts'>('listings');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statsRes, listingsRes, postsRes] = await Promise.all([
        api.get('/api/auth/stats/'),
        api.get('/api/swipes/listings/my_listings/'),
        api.get('/api/forum/posts/my_posts/'),
      ]);
      setStats(statsRes.data);
      setMyListings(listingsRes.data.results || listingsRes.data);
      setMyPosts(postsRes.data.results || postsRes.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshUser()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const campus = user?.campus === 'LC' ? 'Lincoln Center' : 'Rose Hill';

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#800000" />}
    >
      {/* Profile Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.full_name?.charAt(0) || '?'}</Text>
        </View>
        <Text style={s.name}>{user?.full_name}</Text>
        <Text style={s.email}>{user?.email}</Text>
        <Text style={s.campusText}>{campus}</Text>
      </View>

      {/* Stats Cards */}
      <View style={s.statsRow}>
        <StatBox label="Donated" value={user?.swipes_donated ?? 0} color="#2e7d32" />
        <StatBox label="Received" value={user?.swipes_received ?? 0} color="#1565c0" />
        <StatBox label="Reliability" value={user?.reliability_score ?? '5.0'} color="#f9a825" />
      </View>

      {stats && (
        <View style={s.extraStats}>
          <MiniStat label="Active Listings" value={stats.active_listings ?? 0} />
          <MiniStat label="Forum Posts" value={stats.total_posts ?? 0} />
          <MiniStat label="Completed" value={stats.completed_matches ?? 0} />
        </View>
      )}

      {/* Tab Toggle */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === 'listings' && s.tabActive]} onPress={() => setTab('listings')}>
          <Text style={[s.tabText, tab === 'listings' && s.tabActiveText]}>My Listings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'posts' && s.tabActive]} onPress={() => setTab('posts')}>
          <Text style={[s.tabText, tab === 'posts' && s.tabActiveText]}>My Posts</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === 'listings' ? (
        myListings.length === 0 ? (
          <Text style={s.empty}>No listings yet</Text>
        ) : (
          myListings.map((l) => (
            <View key={l.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.badge, { backgroundColor: l.type === 'donation' ? '#e8f5e9' : '#e3f2fd' }]}>
                  <Text style={[s.badgeText, { color: l.type === 'donation' ? '#2e7d32' : '#1565c0' }]}>
                    {l.type === 'donation' ? 'Donation' : 'Request'}
                  </Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: l.status === 'active' ? '#e8f5e9' : '#f5f5f5' }]}>
                  <Text style={s.statusText}>{l.status}</Text>
                </View>
              </View>
              <Text style={s.cardTitle}>{l.available_date}</Text>
              <Text style={s.cardMeta}>{l.quantity} swipe{l.quantity !== 1 ? 's' : ''} · {l.quantity} swipe{l.quantity !== 1 ? 's' : ''}</Text>
            </View>
          ))
        )
      ) : (
        myPosts.length === 0 ? (
          <Text style={s.empty}>No posts yet</Text>
        ) : (
          myPosts.map((p) => (
            <View key={p.id} style={s.card}>
              <Text style={s.cardTitle}>{p.title}</Text>
              <Text style={s.cardMeta} numberOfLines={1}>{p.content}</Text>
              <View style={s.postStats}>
                <Text style={s.postStat}>♥ {p.likes_count}</Text>
                <Text style={s.postStat}>💬 {p.comments_count}</Text>
                <Text style={s.postStat}>👁 {p.views_count}</Text>
              </View>
            </View>
          ))
        )
      )}

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#c62828" />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function StatBox({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.miniStat}>
      <Text style={s.miniValue}>{value}</Text>
      <Text style={s.miniLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#800000', alignItems: 'center', paddingVertical: 28, paddingBottom: 36 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  email: { color: '#ffcdd2', fontSize: 14, marginTop: 2 },
  campusText: { color: '#ffcdd2', fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: -20, gap: 10 },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  extraStats: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff',
    borderRadius: 12, padding: 14, elevation: 1, gap: 8,
  },
  miniStat: { flex: 1, alignItems: 'center' },
  miniValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  miniLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 20, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  tabActive: { backgroundColor: '#800000', borderColor: '#800000' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#555' },
  tabActiveText: { color: '#fff' },
  empty: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 15 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, borderRadius: 12,
    padding: 14, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  statusText: { fontSize: 11, color: '#555', fontWeight: '500' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardMeta: { fontSize: 13, color: '#777', marginTop: 2 },
  postStats: { flexDirection: 'row', gap: 14, marginTop: 6 },
  postStat: { fontSize: 12, color: '#888' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 24, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#c62828',
  },
  logoutText: { color: '#c62828', fontSize: 16, fontWeight: '600' },
});
