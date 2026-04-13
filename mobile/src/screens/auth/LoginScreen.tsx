/**
 * Login Screen
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthStackParamList} from '@types';
import {useAuth} from '@contexts/AuthContext';
import Button from '@components/Button';
import Input from '@components/Input';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {login} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {email?: string; password?: string} = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await login(email.toLowerCase().trim(), password);
      // Navigation is handled automatically by RootNavigator
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        'Login failed. Please check your credentials and try again.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Fordham SwipeShare</Text>
          <Text style={styles.subtitle}>
            Share meal swipes with fellow Rams
          </Text>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your @fordham.edu email"
              value={email}
              onChangeText={text => {
                setEmail(text);
                setErrors({...errors, email: undefined});
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              icon="email"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                setErrors({...errors, password: undefined});
              }}
              secureTextEntry
              error={errors.password}
              icon="lock"
            />

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <Button
              title="Create Account"
              onPress={() => navigation.navigate('Register')}
              variant="outline"
              style={styles.registerButton}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#800000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: 8,
  },
  registerButton: {
    marginTop: 12,
  },
});

export default LoginScreen;
