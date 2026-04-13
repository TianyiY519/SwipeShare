import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useAuth} from '@contexts/AuthContext';
import Button from '@components/Button';
const ProfileMainScreen = () => {
  const {user, logout} = useAuth();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{user?.full_name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.campus}>{user?.campus === 'RH' ? 'Rose Hill' : 'Lincoln Center'}</Text>
        <Button title="Logout" onPress={logout} variant="danger" style={styles.logoutButton} />
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({container: {flex: 1, backgroundColor: '#F5F5F5'}, content: {padding: 24, alignItems: 'center'}, title: {fontSize: 24, fontWeight: 'bold', color: '#800000'}, email: {fontSize: 16, color: '#666', marginTop: 8}, campus: {fontSize: 14, color: '#999', marginTop: 4}, logoutButton: {marginTop: 32, width: 200}});
export default ProfileMainScreen;
