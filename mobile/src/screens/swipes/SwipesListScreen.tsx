/**
 * Swipes List Screen
 * Browse available swipe donations and requests
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {format} from 'date-fns';
import {SwipesStackParamList, SwipeListing} from '@types';
import {swipeService} from '@services/swipeService';
import Card from '@components/Card';
import Button from '@components/Button';
import Loading from '@components/Loading';

type Props = NativeStackScreenProps<SwipesStackParamList, 'SwipesList'>;

const SwipesListScreen: React.FC<Props> = ({navigation}) => {
  const [listings, setListings] = useState<SwipeListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'donation' | 'request'>('all');

  useEffect(() => {
    loadListings();
  }, [filter]);

  const loadListings = async () => {
    try {
      const response = await swipeService.getListings({
        type: filter === 'all' ? undefined : filter,
        exclude_mine: true,
      });
      setListings(response.results);
    } catch (error) {
      console.error('Error loading listings:', error);
      Alert.alert('Error', 'Failed to load swipe listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const renderListing = ({item}: {item: SwipeListing}) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('SwipeDetail', {id: item.id})}>
      <Card style={styles.listingCard}>
        <View style={styles.listingHeader}>
          <View
            style={[
              styles.typeBadge,
              item.type === 'donation' ? styles.donationBadge : styles.requestBadge,
            ]}>
            <Text style={styles.typeBadgeText}>
              {item.type === 'donation' ? 'Offering' : 'Requesting'}
            </Text>
          </View>
          <Text style={styles.campus}>
            {item.campus === 'RH' ? 'Rose Hill' : 'Lincoln Center'}
          </Text>
        </View>

        <View style={styles.listingContent}>
          <View style={styles.quantityRow}>
            <Icon name="food" size={20} color="#800000" />
            <Text style={styles.quantity}>{item.quantity} swipe{item.quantity > 1 ? 's' : ''}</Text>
          </View>

          {item.dining_hall && (
            <View style={styles.infoRow}>
              <Icon name="map-marker" size={16} color="#666" />
              <Text style={styles.infoText}>{item.dining_hall}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Icon name="calendar" size={16} color="#666" />
            <Text style={styles.infoText}>
              {format(new Date(item.available_date), 'MMM d, yyyy')}
              {item.available_time && ` at ${item.available_time}`}
            </Text>
          </View>

          {item.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              {item.notes}
            </Text>
          )}
        </View>

        <View style={styles.listingFooter}>
          <View style={styles.userInfo}>
            <Icon name="account" size={16} color="#666" />
            <Text style={styles.userName}>{item.user.full_name}</Text>
            <Icon name="star" size={14} color="#FFD700" style={{marginLeft: 8}} />
            <Text style={styles.rating}>{item.user.reliability_score}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading message="Loading swipe listings..." />;
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}>
          <Text
            style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive,
            ]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'donation' && styles.filterButtonActive]}
          onPress={() => setFilter('donation')}>
          <Text
            style={[
              styles.filterButtonText,
              filter === 'donation' && styles.filterButtonTextActive,
            ]}>
            Donations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'request' && styles.filterButtonActive]}
          onPress={() => setFilter('request')}>
          <Text
            style={[
              styles.filterButtonText,
              filter === 'request' && styles.filterButtonTextActive,
            ]}>
            Requests
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listings}
        renderItem={renderListing}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="food-off" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No swipes available</Text>
          </View>
        }
      />

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateSwipe')}>
          <Icon name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#800000',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  listingCard: {
    marginBottom: 12,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  donationBadge: {
    backgroundColor: '#E8F5E9',
  },
  requestBadge: {
    backgroundColor: '#E3F2FD',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  campus: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  listingContent: {
    marginBottom: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default SwipesListScreen;
