import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: '', username: '', full_name: '', password: '', password_confirm: '', campus: 'RH',
  });
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleRegister = async () => {
    if (!form.email || !form.username || !form.full_name || !form.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!form.email.endsWith('@fordham.edu')) {
      Alert.alert('Error', 'Must use a @fordham.edu email');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.password_confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      const res = await register({ ...form, email: form.email.toLowerCase().trim() });
      if (res.message) {
        Alert.alert('Success', res.message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
        Alert.alert('Registration Failed', msg);
      } else {
        Alert.alert('Error', 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.container}>
          <Text style={s.title}>Join SwipeShare</Text>

          <Text style={s.label}>Email *</Text>
          <TextInput style={s.input} placeholder="your.name@fordham.edu" placeholderTextColor="#999" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.label}>Username *</Text>
          <TextInput style={s.input} placeholder="Choose a username" placeholderTextColor="#999" value={form.username} onChangeText={(v) => update('username', v)} autoCapitalize="none" />

          <Text style={s.label}>Full Name *</Text>
          <TextInput style={s.input} placeholder="Your full name" placeholderTextColor="#999" value={form.full_name} onChangeText={(v) => update('full_name', v)} />

          <Text style={s.label}>Campus *</Text>
          <View style={s.campusRow}>
            {(['RH', 'LC'] as const).map((c) => (
              <TouchableOpacity key={c} style={[s.campusBtn, form.campus === c && s.campusSel]} onPress={() => update('campus', c)}>
                <Text style={[s.campusBtnText, form.campus === c && s.campusSelText]}>{c === 'RH' ? 'Rose Hill' : 'Lincoln Center'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Password *</Text>
          <TextInput style={s.input} placeholder="At least 8 characters" placeholderTextColor="#999" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />

          <Text style={s.label}>Confirm Password *</Text>
          <TextInput style={s.input} placeholder="Re-enter password" placeholderTextColor="#999" value={form.password_confirm} onChangeText={(v) => update('password_confirm', v)} secureTextEntry />

          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.link} onPress={() => navigation.goBack()}>
            <Text style={s.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flexGrow: 1 },
  container: { padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#800000', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14, fontSize: 16, color: '#333',
  },
  campusRow: { flexDirection: 'row', gap: 10 },
  campusBtn: {
    flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ddd',
    backgroundColor: '#fff', alignItems: 'center',
  },
  campusSel: { backgroundColor: '#800000', borderColor: '#800000' },
  campusBtnText: { fontSize: 15, color: '#333', fontWeight: '600' },
  campusSelText: { color: '#fff' },
  btn: {
    backgroundColor: '#800000', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 28,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  link: { marginTop: 16, alignItems: 'center', paddingBottom: 40 },
  linkText: { color: '#800000', fontSize: 15 },
});
