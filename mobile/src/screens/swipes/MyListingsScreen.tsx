import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
const MyListingsScreen = () => (<View style={styles.container}><Text style={styles.text}>My Listings</Text></View>);
const styles = StyleSheet.create({container: {flex: 1, justifyContent: 'center', alignItems: 'center'}, text: {fontSize: 18, fontWeight: 'bold', color: '#800000'}});
export default MyListingsScreen;
