/**
 * Swipes Navigator
 * Stack navigator for swipe listing screens
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SwipesStackParamList} from '@types';

// Import screens
import SwipesListScreen from '@screens/swipes/SwipesListScreen';
import SwipeDetailScreen from '@screens/swipes/SwipeDetailScreen';
import CreateSwipeScreen from '@screens/swipes/CreateSwipeScreen';
import MyListingsScreen from '@screens/swipes/MyListingsScreen';
import MyMatchesScreen from '@screens/swipes/MyMatchesScreen';
import MatchDetailScreen from '@screens/swipes/MatchDetailScreen';

const Stack = createNativeStackNavigator<SwipesStackParamList>();

const SwipesNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#800000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="SwipesList"
        component={SwipesListScreen}
        options={{title: 'Available Swipes'}}
      />
      <Stack.Screen
        name="SwipeDetail"
        component={SwipeDetailScreen}
        options={{title: 'Swipe Details'}}
      />
      <Stack.Screen
        name="CreateSwipe"
        component={CreateSwipeScreen}
        options={{title: 'Create Listing'}}
      />
      <Stack.Screen
        name="MyListings"
        component={MyListingsScreen}
        options={{title: 'My Listings'}}
      />
      <Stack.Screen
        name="MyMatches"
        component={MyMatchesScreen}
        options={{title: 'My Matches'}}
      />
      <Stack.Screen
        name="MatchDetail"
        component={MatchDetailScreen}
        options={{title: 'Match Details'}}
      />
    </Stack.Navigator>
  );
};

export default SwipesNavigator;
