/**
 * Forum Navigator
 * Stack navigator for forum screens
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ForumStackParamList} from '@types';

// Import screens
import PostsListScreen from '@screens/forum/PostsListScreen';
import PostDetailScreen from '@screens/forum/PostDetailScreen';
import CreatePostScreen from '@screens/forum/CreatePostScreen';
import MyPostsScreen from '@screens/forum/MyPostsScreen';

const Stack = createNativeStackNavigator<ForumStackParamList>();

const ForumNavigator: React.FC = () => {
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
        name="PostsList"
        component={PostsListScreen}
        options={{title: 'Campus Forum'}}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{title: 'Post Details'}}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{title: 'Create Post'}}
      />
      <Stack.Screen
        name="MyPosts"
        component={MyPostsScreen}
        options={{title: 'My Posts'}}
      />
    </Stack.Navigator>
  );
};

export default ForumNavigator;
