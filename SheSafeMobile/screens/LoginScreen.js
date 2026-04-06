import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { login } from '../services/authService';

const LoginScreen = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name]);

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const result = await login(name.trim(), phone.trim());
      
      if (result.success) {
        onLogin(result.user);
      } else {
        Alert.alert('Login Failed', result.message || 'Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🛡️</Text>
          <Text style={styles.title}>SheSafe</Text>
          <Text style={styles.subtitle}>Your Safety, Our Priority</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Welcome!</Text>
          <Text style={styles.welcomeText}>
            Please enter your details to get started
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) {
                  setErrors({ ...errors, name: null });
                }
              }}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Get Started</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By continuing, you agree to share your location for safety purposes during trips and emergencies.
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🆘</Text>
            <Text style={styles.featureText}>SOS Emergency Alert</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🚗</Text>
            <Text style={styles.featureText}>Trip Tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureText}>Buddy System</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS['4xl'],
    fontWeight: FONTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  welcomeTitle: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  welcomeText: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    fontSize: FONTS.base,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONTS.xs,
    marginTop: SPACING.xs,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
  },
  disclaimer: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.base,
    lineHeight: 18,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  featureText: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    fontWeight: FONTS.medium,
  },
});

export default LoginScreen;
