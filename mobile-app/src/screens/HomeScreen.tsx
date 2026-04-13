import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../AuthContext';
import api from '../api';

interface NewsItem {
  type: 'message' | 'comment' | 'like' | 'listing';
  text: string;
  detail: string;
  created_at: string;
  conversation_id?: number;
  post_id?: number;
}

const ICON_MAP: Record<string, { name: string; color: string; bg: string }> = {
  message: { name: 'mail', color: '#1565c0', bg: '#e3f2fd' },
  comment: { name: 'chatbubble', color: '#7b1fa2', bg: '#f3e5f5' },
  like:    { name: 'heart', color: '#c62828', bg: '#ffebee' },
  listing: { name: 'restaurant', color: '#2e7d32', bg: '#e8f5e9' },
};

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statsRes, newsRes] = await Promise.all([
        api.get('/api/auth/stats/'),
        api.get('/api/auth/whats-new/'),
      ]);
      setStats(statsRes.data);
      setNews(newsRes.data.items || []);
    } catch {} finally { setNewsLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const campus = user?.campus === 'LC' ? 'Lincoln Center' : 'Rose Hill';

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#800000" />}
    >
      <View style={s.header}>
        <Text style={s.greeting}>Welcome back,</Text>
        <Text style={s.name}>{user?.full_name}</Text>
        <Text style={s.campus}>{campus} Campus</Text>
      </View>

      <View style={s.statsRow}>
        <StatCard label="Donated" value={stats?.swipes_donated ?? user?.swipes_donated ?? 0} icon="heart" color="#2e7d32" />
        <StatCard label="Received" value={stats?.swipes_received ?? user?.swipes_received ?? 0} icon="restaurant" color="#1565c0" />
        <StatCard label="Score" value={user?.reliability_score ?? '5.0'} icon="star" color="#f9a825" />
      </View>

      <Text style={s.section}>Quick Actions</Text>
      <View style={s.actionsGrid}>
        <ActionTile icon="add-circle" label="Post Swipe" color="#2e7d32"
          onPress={() => navigation.navigate('Swipes', { screen: 'CreateSwipe' })} />
        <ActionTile icon="search" label="Find Swipe" color="#1565c0"
          onPress={() => navigation.navigate('Swipes')} />
        <ActionTile icon="chatbubble-ellipses" label="Forum" color="#7b1fa2"
          onPress={() => navigation.navigate('Forum')} />
        <ActionTile icon="person" label="Profile" color="#e65100"
          onPress={() => navigation.navigate('Profile')} />
      </View>

      {/* What's New */}
      <Text style={s.section}>What's New</Text>
      {newsLoading ? (
        <ActivityIndicator color="#800000" style={{ marginTop: 10 }} />
      ) : news.length === 0 ? (
        <View style={s.emptyNews}>
          <Ionicons name="checkmark-circle-outline" size={36} color="#ccc" />
          <Text style={s.emptyText}>You're all caught up!</Text>
        </View>
      ) : (
        <View style={s.newsList}>
          {news.map((item, i) => {
            const icon = ICON_MAP[item.type] || ICON_MAP.listing;
            const onPress = async () => {
              if (item.type === 'message' && item.conversation_id) {
                try {
                  const res = await api.get(`/api/messaging/conversations/${item.conversation_id}/`);
                  navigation.navigate('Messages', { screen: 'MessagesList' });
                  setTimeout(() => {
                    navigation.navigate('Messages', { screen: 'ChatDetail', params: { conversation: res.data } });
                  }, 100);
                } catch {}
              } else if ((item.type === 'comment' || item.type === 'like') && item.post_id) {
                navigation.navigate('Forum', { screen: 'ForumList' });
                setTimeout(() => {
                  navigation.navigate('Forum', { screen: 'PostDetail', params: { postId: item.post_id } });
                }, 100);
              }
            };
            return (
              <TouchableOpacity key={i} style={s.newsItem} onPress={onPress} activeOpacity={0.7}>
                <View style={[s.newsIcon, { backgroundColor: icon.bg }]}>
                  <Ionicons name={icon.name as any} size={18} color={icon.color} />
                </View>
                <View style={s.newsBody}>
                  <Text style={s.newsText}>{item.text}</Text>
                  {item.detail ? <Text style={s.newsDetail} numberOfLines={1}>{item.detail}</Text> : null}
                  <Text style={s.newsTime}>{timeAgo(item.created_at)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {stats && (
        <>
          <Text style={s.section}>Activity Overview</Text>
          <View style={s.overviewCard}>
            <OverviewRow label="Active Listings" value={stats.active_listings ?? 0} />
            <OverviewRow label="Pending Matches" value={stats.pending_matches ?? 0} />
            <OverviewRow label="Completed Swaps" value={stats.completed_matches ?? 0} />
            <OverviewRow label="Forum Posts" value={stats.total_posts ?? 0} />
          </View>
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: any; icon: string; color: string }) {
  return (
    <View style={s.statCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ActionTile({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.actionTile} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.actionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={28} color={color} />
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function OverviewRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.overviewRow}>
      <Text style={s.overviewLabel}>{label}</Text>
      <Text style={s.overviewValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#800000', padding: 24, paddingTop: 12, paddingBottom: 28 },
  greeting: { color: '#ffcdd2', fontSize: 15 },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  campus: { color: '#ffcdd2', fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: -20, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  section: { fontSize: 18, fontWeight: 'bold', color: '#333', marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 12, gap: 10 },
  actionTile: {
    width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  // What's New
  emptyNews: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#aaa', fontSize: 15, marginTop: 8 },
  newsList: { marginHorizontal: 16 },
  newsItem: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 8, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  newsIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  newsBody: { flex: 1 },
  newsText: { fontSize: 14, fontWeight: '600', color: '#333' },
  newsDetail: { fontSize: 13, color: '#777', marginTop: 2 },
  newsTime: { fontSize: 11, color: '#aaa', marginTop: 4 },
  // Overview
  overviewCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16, elevation: 2 },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  overviewLabel: { fontSize: 15, color: '#555' },
  overviewValue: { fontSize: 15, fontWeight: 'bold', color: '#333' },
});
