/**
 * Custom Input Component
 */

import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  icon?: string;
  containerStyle?: any;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  secureTextEntry,
  icon,
  containerStyle,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputContainer}>
        {icon && (
          <Icon name={icon} size={20} color="#666" style={styles.icon} />
        )}

        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          placeholderTextColor="#999"
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.eyeIcon}>
            <Icon
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  icon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  eyeIcon: {
    padding: 12,
  },
  error: {
    fontSize: 12,
    color: '#DC143C',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
