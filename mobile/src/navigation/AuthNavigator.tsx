/**
 * Authentication Navigator
 * Handles login, registration, and email verification screens
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthStackParamList} from '@types';

// Import screens
import LoginScreen from '@screens/auth/LoginScreen';
import RegisterScreen from '@screens/auth/RegisterScreen';
import VerifyEmailScreen from '@screens/auth/VerifyEmailScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#800000', // Fordham maroon
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{title: 'Welcome to SwipeShare'}}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{title: 'Create Account'}}
      />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={{title: 'Verify Email'}}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
