/**
 * Verify Email Screen
 */

import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthStackParamList} from '@types';
import {useAuth} from '@contexts/AuthContext';
import {authService} from '@services/authService';
import Button from '@components/Button';
import Input from '@components/Input';
import Loading from '@components/Loading';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

const VerifyEmailScreen: React.FC<Props> = ({route, navigation}) => {
  const {email, token: routeToken} = route.params;
  const {verifyEmail} = useAuth();
  const [token, setToken] = useState(routeToken || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // If token is provided in route params, auto-verify
    if (routeToken) {
      handleVerify();
    }
  }, [routeToken]);

  const handleVerify = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      await verifyEmail(token.trim());
      Alert.alert(
        'Success',
        'Your email has been verified successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigation will be handled automatically by RootNavigator
            },
          },
        ],
      );
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        'Verification failed. Please check your code and try again.';
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await authService.resendVerification(email);
      Alert.alert('Success', 'Verification email has been sent again!');
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert(
        'Error',
        'Failed to resend verification email. Please try again later.',
      );
    } finally {
      setResending(false);
    }
  };

  if (loading && routeToken) {
    return <Loading message="Verifying your email..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification code to:{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <View style={styles.form}>
          <Input
            label="Verification Code"
            placeholder="Enter the code from your email"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            icon="email-check"
          />

          <Button
            title="Verify Email"
            onPress={handleVerify}
            loading={loading}
            style={styles.verifyButton}
          />

          <Button
            title="Resend Verification Email"
            onPress={handleResend}
            variant="outline"
            loading={resending}
            style={styles.resendButton}
          />

          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login')}
            variant="secondary"
            size="small"
            style={styles.backButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  email: {
    fontWeight: 'bold',
    color: '#800000',
  },
  form: {
    width: '100%',
  },
  verifyButton: {
    marginTop: 8,
  },
  resendButton: {
    marginTop: 12,
  },
  backButton: {
    marginTop: 24,
  },
});

export default VerifyEmailScreen;
