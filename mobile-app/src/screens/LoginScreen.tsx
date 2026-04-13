import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      setLoading(true);
      await login(email.toLowerCase().trim(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error || err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.container}>
          <Text style={s.title}>Fordham{'\n'}SwipeShare</Text>
          <Text style={s.subtitle}>Share meal swipes with fellow Rams</Text>

          <View style={s.form}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="your.name@fordham.edu"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              placeholder="Enter password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={s.btnOutline} onPress={() => navigation.navigate('Register')}>
              <Text style={s.btnOutlineText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flexGrow: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#800000', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 36 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14, fontSize: 16, color: '#333',
  },
  btn: {
    backgroundColor: '#800000', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  btnOutline: {
    borderWidth: 2, borderColor: '#800000', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12,
  },
  btnOutlineText: { color: '#800000', fontSize: 16, fontWeight: '600' },
});
