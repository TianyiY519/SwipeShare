/**
 * Loading Component
 */

import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({message = 'Loading...'}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#800000" />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default Loading;
