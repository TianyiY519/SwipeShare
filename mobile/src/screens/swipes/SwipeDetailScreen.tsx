/**
 * Swipe Detail Screen - Placeholder
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SwipesStackParamList} from '@types';

type Props = NativeStackScreenProps<SwipesStackParamList, 'SwipeDetail'>;

const SwipeDetailScreen: React.FC<Props> = ({route}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Swipe Detail Screen (ID: {route.params.id})</Text>
      <Text style={styles.subtext}>This screen will show detailed swipe information</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24},
  text: {fontSize: 18, fontWeight: 'bold', color: '#800000', textAlign: 'center'},
  subtext: {fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center'},
});

export default SwipeDetailScreen;
