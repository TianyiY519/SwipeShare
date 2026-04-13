import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

interface Post {
  id: number;
  user: { id: number; full_name: string; campus: string; profile_picture: string | null };
  category: string;
  title: string;
  content: string;
  tags: string[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  created_at: string;
}

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'housing', label: 'Housing' },
  { key: 'marketplace', label: 'Market' },
  { key: 'rideshare', label: 'Rides' },
  { key: 'events', label: 'Events' },
  { key: 'general', label: 'General' },
];

const CAT_LABELS: Record<string, string> = {
  housing: 'Housing & Sublets', marketplace: 'Marketplace',
  rideshare: 'Ride Sharing', events: 'Events', general: 'General',
};

export default function ForumScreen({ navigation }: any) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'new' | 'hot' | 'best'>('new');

  const load = useCallback(async () => {
    try {
      const orderMap = { new: '-created_at', hot: '-comments_count', best: '-likes_count' };
      const params: any = { ordering: orderMap[sort] };
      if (category) params.category = category;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/api/forum/posts/', { params });
      setPosts(res.data.results || res.data);
    } catch {} finally { setLoading(false); }
  }, [category, search, sort]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleLike = async (post: Post) => {
    try {
      const res = await api.post(`/api/forum/posts/${post.id}/like/`);
      setPosts((prev) => prev.map((p) =>
        p.id === post.id ? { ...p, likes_count: res.data.likes_count, is_liked: res.data.liked } : p
      ));
    } catch {}
  };

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity style={s.card} onPress={() => navigation.navigate('PostDetail', { postId: item.id })} activeOpacity={0.7}>
      <View style={s.cardTop}>
        <View style={s.catBadge}>
          <Text style={s.catText}>{CAT_LABELS[item.category] || item.category}</Text>
        </View>
        <Text style={s.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={s.title} numberOfLines={2}>{item.title}</Text>
      {item.tags && item.tags.length > 0 && (
        <View style={s.tagsRow}>
          {item.tags.slice(0, 3).map((t) => <Text key={t} style={s.tag}>#{t}</Text>)}
        </View>
      )}
      <Text style={s.preview} numberOfLines={2}>{item.content}</Text>
      <View style={s.footer}>
        <Text style={s.author}>{item.user.full_name}</Text>
        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => handleLike(item)}>
            <Ionicons name={item.is_liked ? 'heart' : 'heart-outline'} size={16} color={item.is_liked ? '#c62828' : '#888'} />
            <Text style={s.actionText}>{item.likes_count}</Text>
          </TouchableOpacity>
          <View style={s.actionBtn}>
            <Ionicons name="chatbubble-outline" size={14} color="#888" />
            <Text style={s.actionText}>{item.comments_count}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.searchRow}>
        <Ionicons name="search" size={18} color="#999" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search posts..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={load}
          returnKeyType="search"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterList} contentContainerStyle={s.filterContent}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity key={item.key} style={[s.filterChip, category === item.key && s.filterActive]} onPress={() => setCategory(item.key)}>
            <Text style={[s.filterChipText, category === item.key && s.filterActiveText]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.sortRow}>
        {([['new', 'New'], ['hot', 'Hot'], ['best', 'Best']] as const).map(([key, label]) => (
          <TouchableOpacity key={key} style={[s.sortBtn, sort === key && s.sortActive]} onPress={() => setSort(key)}>
            <Text style={[s.sortText, sort === key && s.sortActiveText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#800000" />}
        contentContainerStyle={s.list}
        ListEmptyComponent={loading ? null : <Text style={s.empty}>No posts found</Text>}
      />

      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreatePost')} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', margin: 12, marginBottom: 0,
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ddd',
  },
  searchIcon: { marginLeft: 12 },
  searchInput: { flex: 1, padding: 12, fontSize: 15, color: '#333' },
  filterList: { flexGrow: 0, marginTop: 10 },
  filterContent: { paddingHorizontal: 12, gap: 8 },
  sortRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  sortBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f0f0f0' },
  sortActive: { backgroundColor: '#333' },
  sortText: { fontSize: 12, color: '#666', fontWeight: '500' },
  sortActiveText: { color: '#fff' },
  filterChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginRight: 6,
  },
  filterActive: { backgroundColor: '#800000', borderColor: '#800000' },
  filterChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterActiveText: { color: '#fff' },
  list: { padding: 12, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catBadge: { backgroundColor: '#f0f0f0', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  catText: { fontSize: 11, fontWeight: '600', color: '#555' },
  date: { fontSize: 12, color: '#999' },
  title: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 4 },
  tagsRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  tag: { fontSize: 12, color: '#800000' },
  preview: { fontSize: 14, color: '#666', lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  author: { fontSize: 12, color: '#999' },
  actions: { flexDirection: 'row', gap: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, color: '#888' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#800000', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
  },
});
