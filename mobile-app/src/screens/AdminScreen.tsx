import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';

type AdminTab = 'dashboard' | 'reports' | 'users' | 'actions';

export default function AdminScreen() {
  const [tab, setTab] = useState<AdminTab>('dashboard');

  return (
    <View style={s.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {([['dashboard', 'Dashboard'], ['reports', 'Reports'], ['users', 'Users'], ['actions', 'Actions']] as const).map(([key, label]) => (
          <TouchableOpacity key={key} style={[s.tab, tab === key && s.tabActive]} onPress={() => setTab(key)}>
            <Text style={[s.tabText, tab === key && s.tabActiveText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'reports' && <Reports />}
      {tab === 'users' && <Users />}
      {tab === 'actions' && <Actions />}
    </View>
  );
}

// ─── Dashboard ───
function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/moderation/reports/stats/'),
      api.get('/api/moderation/actions/'),
    ]).then(([rRes, aRes]) => {
      setStats({ ...rRes.data, total_actions: (aRes.data.results || aRes.data).length });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#800000" /></View>;

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <View style={s.statsGrid}>
        <StatCard label="Pending" value={stats?.pending_reports ?? 0} color="#e65100" />
        <StatCard label="Under Review" value={stats?.under_review_reports ?? 0} color="#1565c0" />
        <StatCard label="Resolved" value={stats?.resolved_reports ?? 0} color="#2e7d32" />
        <StatCard label="Dismissed" value={stats?.dismissed_reports ?? 0} color="#888" />
      </View>
      <View style={s.infoCard}>
        <Text style={s.infoRow}>Total Reports: <Text style={s.bold}>{stats?.total_reports ?? 0}</Text></Text>
        <Text style={s.infoRow}>Total Actions: <Text style={s.bold}>{stats?.total_actions ?? 0}</Text></Text>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Reports ───
function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/moderation/reports/', { params: { status: filter } });
      setReports(res.data.results || res.data);
    } catch {} finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id: number) => {
    try {
      await api.post(`/api/moderation/reports/${id}/resolve/`, { admin_notes: 'Resolved from mobile' });
      load();
    } catch (err: any) { Alert.alert('Error', err.response?.data?.detail || 'Failed'); }
  };

  const handleDismiss = async (id: number) => {
    try {
      await api.post(`/api/moderation/reports/${id}/dismiss/`, { admin_notes: 'Dismissed from mobile' });
      load();
    } catch (err: any) { Alert.alert('Error', err.response?.data?.detail || 'Failed'); }
  };

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {['pending', 'under_review', 'resolved', 'dismissed'].map((f) => (
          <TouchableOpacity key={f} style={[s.filterChip, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterActiveText]}>{f.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? <ActivityIndicator color="#800000" /> : reports.length === 0 ? (
        <Text style={s.empty}>No reports found</Text>
      ) : reports.map((r) => (
        <View key={r.id} style={s.card}>
          <View style={s.cardRow}>
            <View style={[s.badge, { backgroundColor: '#f0f0f0' }]}><Text style={s.badgeText}>{r.content_type}</Text></View>
            <View style={[s.badge, { backgroundColor: '#fff3e0' }]}><Text style={[s.badgeText, { color: '#e65100' }]}>{r.reason}</Text></View>
          </View>
          <Text style={s.cardMeta}>By {r.reporter?.full_name ?? 'Unknown'} · {new Date(r.created_at).toLocaleDateString()}</Text>
          {r.description ? <Text style={s.cardDesc} numberOfLines={2}>{r.description}</Text> : null}
          {(r.status === 'pending' || r.status === 'under_review') && (
            <View style={s.cardActions}>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#2e7d32' }]} onPress={() => handleResolve(r.id)}>
                <Text style={s.actionBtnText}>Resolve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#888' }]} onPress={() => handleDismiss(r.id)}>
                <Text style={s.actionBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Users ───
function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/api/auth/admin/users/', { params });
      setUsers(res.data.results || res.data);
    } catch {} finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (userId: number, action: string) => {
    try {
      const body: any = { action };
      if (action === 'suspend') body.duration_days = 7;
      await api.post(`/api/auth/admin/users/${userId}/toggle-active/`, body);
      Alert.alert('Success', `User ${action}d`);
      load();
    } catch (err: any) { Alert.alert('Error', err.response?.data?.detail || 'Failed'); }
  };

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <View style={s.searchRow}>
        <Ionicons name="search" size={16} color="#999" style={{ marginLeft: 10 }} />
        <TextInput style={s.searchInput} placeholder="Search users..." placeholderTextColor="#999"
          value={search} onChangeText={setSearch} onSubmitEditing={() => load()} />
      </View>
      {loading ? <ActivityIndicator color="#800000" /> : users.length === 0 ? (
        <Text style={s.empty}>No users found</Text>
      ) : users.map((u) => (
        <View key={u.id} style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.userName}>{u.full_name}</Text>
            {u.is_staff && <View style={[s.badge, { backgroundColor: '#800000' }]}><Text style={[s.badgeText, { color: '#fff' }]}>Admin</Text></View>}
          </View>
          <Text style={s.cardMeta}>{u.email}</Text>
          <Text style={s.cardMeta}>ID: {u.id} · {u.campus === 'RH' ? 'Rose Hill' : 'Lincoln Center'} · Joined {new Date(u.created_at).toLocaleDateString()}</Text>
          <View style={s.cardRow}>
            <View style={[s.badge, { backgroundColor: u.is_active ? '#e8f5e9' : '#ffebee' }]}>
              <Text style={[s.badgeText, { color: u.is_active ? '#2e7d32' : '#c62828' }]}>{u.is_active ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
          {!u.is_staff && (
            <View style={s.cardActions}>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#e65100' }]} onPress={() => handleAction(u.id, 'suspend')}>
                <Text style={s.actionBtnText}>Suspend 7d</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#c62828' }]} onPress={() => handleAction(u.id, 'ban')}>
                <Text style={s.actionBtnText}>Ban</Text>
              </TouchableOpacity>
              {!u.is_active && (
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#2e7d32' }]} onPress={() => handleAction(u.id, 'activate')}>
                  <Text style={s.actionBtnText}>Activate</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Actions ───
function Actions() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/moderation/actions/')
      .then((res) => setActions(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView contentContainerStyle={s.pad}>
      {loading ? <ActivityIndicator color="#800000" /> : actions.length === 0 ? (
        <Text style={s.empty}>No actions taken yet</Text>
      ) : actions.map((a) => (
        <View key={a.id} style={s.card}>
          <View style={s.cardRow}>
            <View style={[s.badge, { backgroundColor: '#fff3e0' }]}><Text style={[s.badgeText, { color: '#e65100' }]}>{a.action_type}</Text></View>
            {a.duration && <View style={[s.badge, { backgroundColor: '#e3f2fd' }]}><Text style={[s.badgeText, { color: '#1565c0' }]}>{a.duration}</Text></View>}
          </View>
          <Text style={s.cardMeta}>Target: User #{a.target_user}</Text>
          <Text style={s.cardMeta}>By {a.admin?.full_name ?? 'Admin'} · {new Date(a.created_at).toLocaleDateString()}</Text>
          {a.notes ? <Text style={s.cardDesc}>{a.notes}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pad: { padding: 12 },
  tabBar: { flexGrow: 0, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabBarContent: { paddingHorizontal: 8, gap: 4 },
  tab: { paddingVertical: 12, paddingHorizontal: 16 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#800000' },
  tabText: { fontSize: 14, color: '#888', fontWeight: '500' },
  tabActiveText: { color: '#800000', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  infoRow: { fontSize: 15, color: '#555', paddingVertical: 4 },
  bold: { fontWeight: 'bold', color: '#333' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd', marginBottom: 12,
  },
  searchInput: { flex: 1, padding: 10, fontSize: 14, color: '#333' },
  filterChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, marginRight: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
  },
  filterActive: { backgroundColor: '#800000', borderColor: '#800000' },
  filterText: { fontSize: 13, color: '#555', fontWeight: '500', textTransform: 'capitalize' },
  filterActiveText: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#555' },
  userName: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  cardDesc: { fontSize: 13, color: '#555', marginTop: 6 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 15 },
});
