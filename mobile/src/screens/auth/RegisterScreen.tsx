/**
 * Register Screen
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
import {Picker} from '@react-native-picker/picker';
import {AuthStackParamList, Campus} from '@types';
import {useAuth} from '@contexts/AuthContext';
import Button from '@components/Button';
import Input from '@components/Input';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({navigation}) => {
  const {register} = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    full_name: '',
    campus: 'RH' as Campus,
    phone_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData({...formData, [field]: value});
    setErrors({...errors, [field]: undefined});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.endsWith('@fordham.edu')) {
      newErrors.email = 'Must be a @fordham.edu email';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await register({
        ...formData,
        email: formData.email.toLowerCase().trim(),
      });

      Alert.alert(
        'Registration Successful',
        response.message,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('VerifyEmail', {email: formData.email}),
          },
        ],
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorData = error.response?.data;

      if (errorData && typeof errorData === 'object') {
        setErrors(errorData);
      } else {
        Alert.alert(
          'Registration Failed',
          'An error occurred during registration. Please try again.',
        );
      }
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
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Join the Fordham SwipeShare community</Text>

          <View style={styles.form}>
            <Input
              label="Email *"
              placeholder="your.name@fordham.edu"
              value={formData.email}
              onChangeText={text => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              icon="email"
            />

            <Input
              label="Username *"
              placeholder="Choose a username"
              value={formData.username}
              onChangeText={text => updateField('username', text)}
              autoCapitalize="none"
              error={errors.username}
              icon="account"
            />

            <Input
              label="Full Name *"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChangeText={text => updateField('full_name', text)}
              error={errors.full_name}
              icon="account-circle"
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Campus *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.campus}
                  onValueChange={value => updateField('campus', value as Campus)}>
                  <Picker.Item label="Rose Hill" value="RH" />
                  <Picker.Item label="Lincoln Center" value="LC" />
                </Picker>
              </View>
            </View>

            <Input
              label="Phone Number (Optional)"
              placeholder="+1234567890"
              value={formData.phone_number}
              onChangeText={text => updateField('phone_number', text)}
              keyboardType="phone-pad"
              icon="phone"
            />

            <Input
              label="Password *"
              placeholder="At least 8 characters"
              value={formData.password}
              onChangeText={text => updateField('password', text)}
              secureTextEntry
              error={errors.password}
              icon="lock"
            />

            <Input
              label="Confirm Password *"
              placeholder="Re-enter your password"
              value={formData.password_confirm}
              onChangeText={text => updateField('password_confirm', text)}
              secureTextEntry
              error={errors.password_confirm}
              icon="lock-check"
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            <Button
              title="Already have an account? Login"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={styles.loginButton}
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
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#800000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  registerButton: {
    marginTop: 8,
  },
  loginButton: {
    marginTop: 12,
  },
});

export default RegisterScreen;
