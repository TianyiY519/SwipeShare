/**
 * Main Navigator
 * Bottom tab navigation for the main app screens
 */

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {MainTabParamList} from '@types';

// Import navigators
import HomeScreen from '@screens/main/HomeScreen';
import SwipesNavigator from './SwipesNavigator';
import ForumNavigator from './ForumNavigator';
import ProfileNavigator from './ProfileNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName = 'home';

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Swipes') {
            iconName = 'food';
          } else if (route.name === 'Forum') {
            iconName = 'forum';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#800000', // Fordham maroon
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#800000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: 'SwipeShare'}}
      />
      <Tab.Screen
        name="Swipes"
        component={SwipesNavigator}
        options={{headerShown: false}}
      />
      <Tab.Screen
        name="Forum"
        component={ForumNavigator}
        options={{headerShown: false}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{headerShown: false}}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
