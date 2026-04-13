import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
const MyPostsScreen = () => (<View style={styles.container}><Text style={styles.text}>My Posts</Text></View>);
const styles = StyleSheet.create({container: {flex: 1, justifyContent: 'center', alignItems: 'center'}, text: {fontSize: 18, fontWeight: 'bold', color: '#800000'}});
export default MyPostsScreen;
