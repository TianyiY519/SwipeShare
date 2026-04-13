import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import SwipesScreen from './src/screens/SwipesScreen';
import SwipeDetailScreen from './src/screens/SwipeDetailScreen';
import CreateSwipeScreen from './src/screens/CreateSwipeScreen';
import ForumScreen from './src/screens/ForumScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import AdminScreen from './src/screens/AdminScreen';

const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const SwipesStack = createNativeStackNavigator();
const ForumStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

const baseHeaderStyle = {
  headerStyle: { backgroundColor: '#800000' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' as const },
};

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={logout} style={{ marginRight: 12 }}>
      <Ionicons name="log-out-outline" size={22} color="#fff" />
    </TouchableOpacity>
  );
}

const headerStyle = {
  ...baseHeaderStyle,
  headerRight: () => <LogoutButton />,
};

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={headerStyle}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'SwipeShare' }} />
    </HomeStack.Navigator>
  );
}

function SwipesStackScreen() {
  return (
    <SwipesStack.Navigator screenOptions={headerStyle}>
      <SwipesStack.Screen name="SwipesList" component={SwipesScreen} options={{ title: 'Swipes' }} />
      <SwipesStack.Screen name="SwipeDetail" component={SwipeDetailScreen} options={{ title: 'Listing Details' }} />
      <SwipesStack.Screen name="CreateSwipe" component={CreateSwipeScreen} options={{ title: 'New Listing' }} />
    </SwipesStack.Navigator>
  );
}

function ForumStackScreen() {
  return (
    <ForumStack.Navigator screenOptions={headerStyle}>
      <ForumStack.Screen name="ForumList" component={ForumScreen} options={{ title: 'Forum' }} />
      <ForumStack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <ForumStack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'New Post' }} />
    </ForumStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={headerStyle}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
    </ProfileStack.Navigator>
  );
}

function MessagesStackScreen() {
  return (
    <MessagesStack.Navigator screenOptions={headerStyle}>
      <MessagesStack.Screen name="MessagesList" component={MessagesScreen} options={{ title: 'Messages' }} />
      <MessagesStack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ title: 'Chat' }} />
    </MessagesStack.Navigator>
  );
}

function AdminStackScreen() {
  return (
    <AdminStack.Navigator screenOptions={headerStyle}>
      <AdminStack.Screen name="AdminMain" component={AdminScreen} options={{ title: 'Admin' }} />
    </AdminStack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#800000',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home',
            Swipes: 'restaurant',
            Forum: 'chatbubbles',
            Messages: 'mail',
            Profile: 'person',
            Admin: 'shield',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Swipes" component={SwipesStackScreen} />
      <Tab.Screen name="Forum" component={ForumStackScreen} />
      <Tab.Screen name="Messages" component={MessagesStackScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
      {user?.is_staff && <Tab.Screen name="Admin" component={AdminStackScreen} />}
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#800000" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <MainTabs />
      ) : (
        <AuthStack.Navigator screenOptions={{ ...headerStyle, headerShown: true }}>
          <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'SwipeShare' }} />
          <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
