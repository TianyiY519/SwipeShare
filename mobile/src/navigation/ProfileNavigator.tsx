/**
 * Profile Navigator
 * Stack navigator for profile screens
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ProfileStackParamList} from '@types';

// Import screens
import ProfileMainScreen from '@screens/profile/ProfileMainScreen';
import EditProfileScreen from '@screens/profile/EditProfileScreen';
import UserStatsScreen from '@screens/profile/UserStatsScreen';
import SettingsScreen from '@screens/profile/SettingsScreen';
import ChangePasswordScreen from '@screens/profile/ChangePasswordScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator: React.FC = () => {
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
        name="ProfileMain"
        component={ProfileMainScreen}
        options={{title: 'My Profile'}}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{title: 'Edit Profile'}}
      />
      <Stack.Screen
        name="UserStats"
        component={UserStatsScreen}
        options={{title: 'My Statistics'}}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: 'Settings'}}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{title: 'Change Password'}}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;
