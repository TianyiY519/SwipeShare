/**
 * Fordham SwipeShare Mobile App
 * Main entry point
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {AuthProvider} from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#800000"
      />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default App;
