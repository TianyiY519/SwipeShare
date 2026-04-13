/**
 * Home Screen
 * Dashboard with quick stats and recent activity
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '@contexts/AuthContext';
import {swipeService} from '@services/swipeService';
import {forumService} from '@services/forumService';
import {SwipeStats, PostStats} from '@types';
import Card from '@components/Card';
import Loading from '@components/Loading';

const HomeScreen: React.FC = () => {
  const {user} = useAuth();
  const [swipeStats, setSwipeStats] = useState<SwipeStats | null>(null);
  const [postStats, setPostStats] = useState<PostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [swipes, posts] = await Promise.all([
        swipeService.getStats(),
        forumService.getPostStats(),
      ]);

      setSwipeStats(swipes);
      setPostStats(posts);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return <Loading message="Loading your dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Welcome Section */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.full_name}!</Text>
        <Text style={styles.campus}>
          {user?.campus === 'RH' ? 'Rose Hill' : 'Lincoln Center'} Campus
        </Text>
      </View>

      {/* Quick Stats */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Your SwipeShare Activity</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Icon name="gift" size={32} color="#800000" />
            <Text style={styles.statNumber}>{swipeStats?.total_donations || 0}</Text>
            <Text style={styles.statLabel}>Donated</Text>
          </View>

          <View style={styles.stat}>
            <Icon name="hand-heart" size={32} color="#800000" />
            <Text style={styles.statNumber}>{swipeStats?.total_requests || 0}</Text>
            <Text style={styles.statLabel}>Received</Text>
          </View>

          <View style={styles.stat}>
            <Icon name="check-circle" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{swipeStats?.completed_matches || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.reliabilityBadge}>
          <Icon name="star" size={20} color="#FFD700" />
          <Text style={styles.reliabilityText}>
            Reliability Score: {user?.reliability_score}
          </Text>
        </View>
      </Card>

      {/* Active Listings */}
      {swipeStats && swipeStats.active_listings > 0 && (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Active Listings</Text>
            <Icon name="arrow-right" size={24} color="#800000" />
          </View>
          <Text style={styles.cardSubtitle}>
            You have {swipeStats.active_listings} active listing
            {swipeStats.active_listings !== 1 ? 's' : ''}
          </Text>
        </Card>
      )}

      {/* Pending Matches */}
      {swipeStats && swipeStats.pending_matches > 0 && (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pending Matches</Text>
            <Icon name="arrow-right" size={24} color="#FF9800" />
          </View>
          <Text style={styles.cardSubtitle}>
            {swipeStats.pending_matches} match{swipeStats.pending_matches !== 1 ? 'es' : ''} waiting
            for confirmation
          </Text>
        </Card>
      )}

      {/* Forum Activity */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Forum Activity</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Icon name="post" size={28} color="#800000" />
            <Text style={styles.statNumber}>{postStats?.active_posts || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>

          <View style={styles.stat}>
            <Icon name="comment" size={28} color="#800000" />
            <Text style={styles.statNumber}>{postStats?.total_comments || 0}</Text>
            <Text style={styles.statLabel}>Comments</Text>
          </View>

          <View style={styles.stat}>
            <Icon name="heart" size={28} color="#DC143C" />
            <Text style={styles.statNumber}>{postStats?.total_likes_received || 0}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="plus-circle" size={40} color="#800000" />
            <Text style={styles.actionText}>Post Swipe</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="magnify" size={40} color="#800000" />
            <Text style={styles.actionText}>Find Swipes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="forum" size={40} color="#800000" />
            <Text style={styles.actionText}>Browse Forum</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#800000',
    padding: 24,
    paddingTop: 32,
  },
  greeting: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  campus: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  reliabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
  },
  reliabilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;
