import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { getUserProfile, registerUser } from '../services/userService';

const ProfileScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('Family');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadProfile();
    return () => { mountedRef.current = false; };
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserProfile();
      if (result.success && result.user && mountedRef.current) {
        setName(result.user.name || '');
        setPhone(result.user.phone || '');
        setEmergencyContacts(result.user.emergencyContacts || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    setSaving(true);
    try {
      const result = await registerUser(name.trim(), phone.trim(), emergencyContacts);
      if (result.success && mountedRef.current) {
        // CRITICAL FIX: Re-fetch profile from backend to ensure sync
        const freshProfile = await getUserProfile();
        if (freshProfile.success && freshProfile.user && mountedRef.current) {
          setName(freshProfile.user.name || '');
          setPhone(freshProfile.user.phone || '');
          setEmergencyContacts(freshProfile.user.emergencyContacts || []);
        }
        setLastSaved(new Date().toLocaleTimeString());
        Alert.alert('✅ Success', 'Profile saved successfully!');
      } else if (mountedRef.current) {
        Alert.alert('Error', result.message || 'Failed to save profile');
      }
    } catch (error) {
      if (mountedRef.current) {
        Alert.alert('Error', 'Failed to save profile. Check your connection.');
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [name, phone, emergencyContacts]);

  const handleAddContact = useCallback(() => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Required', 'Please enter contact name and phone');
      return;
    }

    // Validate phone number format
    const phoneClean = newContactPhone.trim().replace(/[^0-9+]/g, '');
    if (phoneClean.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (at least 10 digits)');
      return;
    }

    const newContact = {
      name: newContactName.trim(),
      phone: phoneClean,
      relation: newContactRelation.trim() || 'Family',
    };

    setEmergencyContacts(prev => [...prev, newContact]);
    
    // Clear form inputs immediately
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRelation('Family');
    
    Alert.alert('✅ Added', 'Contact added locally. Click "Save Profile" to store on server.');
  }, [newContactName, newContactPhone, newContactRelation]);

  const handleRemoveContact = useCallback((index) => {
    Alert.alert(
      'Remove Contact',
      `Remove ${emergencyContacts[index]?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setEmergencyContacts(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  }, [emergencyContacts]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name ? name.charAt(0).toUpperCase() : '👤'}
              </Text>
            </View>
            <Text style={styles.title}>My Profile</Text>
            <Text style={styles.subtitle}>
              Manage your profile and emergency contacts
            </Text>
            {lastSaved && (
              <Text style={styles.lastSavedText}>Last saved: {lastSaved}</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Your Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
              <Text style={styles.contactCount}>
                {emergencyContacts.length} contact{emergencyContacts.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              These contacts will receive alerts when you trigger SOS or don't mark yourself safe
            </Text>

            {emergencyContacts.map((contact, index) => (
              <View key={`contact-${index}-${contact.phone}`} style={styles.contactItem}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>
                    {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                  <Text style={styles.contactRelation}>{contact.relation}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveContact(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {emergencyContacts.length === 0 && (
              <View style={styles.emptyContacts}>
                <Text style={styles.emptyContactsIcon}>📇</Text>
                <Text style={styles.emptyContactsText}>
                  No emergency contacts added yet
                </Text>
                <Text style={styles.emptyContactsHint}>
                  Add contacts below to receive SOS alerts
                </Text>
              </View>
            )}

            <View style={styles.addContactSection}>
              <Text style={styles.addContactTitle}>Add New Contact</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Contact name"
                placeholderTextColor={COLORS.textMuted}
                value={newContactName}
                onChangeText={setNewContactName}
                autoCapitalize="words"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={COLORS.textMuted}
                value={newContactPhone}
                onChangeText={setNewContactPhone}
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Relation (e.g., Family, Friend)"
                placeholderTextColor={COLORS.textMuted}
                value={newContactRelation}
                onChangeText={setNewContactRelation}
              />

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddContact}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>+ Add Contact</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <View style={styles.savingRow}>
                <ActivityIndicator color={COLORS.textInverse} />
                <Text style={[styles.saveButtonText, { marginLeft: SPACING.sm }]}>
                  Saving...
                </Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>💾 Save Profile</Text>
            )}
          </TouchableOpacity>

          {/* Refresh button */}
          <TouchableOpacity
            style={styles.refreshProfileButton}
            onPress={loadProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshProfileText}>🔄 Refresh Profile from Server</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: FONTS.bold,
    color: COLORS.textInverse,
  },
  title: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  lastSavedText: {
    fontSize: FONTS.xs,
    color: COLORS.success,
    marginTop: SPACING.xs,
    fontWeight: FONTS.medium,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    fontSize: FONTS.base,
    marginBottom: SPACING.md,
    color: COLORS.text,
    minHeight: 48,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  contactCount: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    fontWeight: FONTS.medium,
  },
  sectionSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.base,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  contactAvatarText: {
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
    color: COLORS.textInverse,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  contactPhone: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  contactRelation: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: COLORS.danger,
    fontWeight: FONTS.bold,
    fontSize: FONTS.base,
  },
  emptyContacts: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyContactsIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  emptyContactsText: {
    fontSize: FONTS.base,
    color: COLORS.textMuted,
    fontWeight: FONTS.medium,
  },
  emptyContactsHint: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  addContactSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.base,
    marginTop: SPACING.sm,
  },
  addContactTitle: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  addButton: {
    backgroundColor: '#DCFCE7',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  addButtonText: {
    color: COLORS.success,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    minHeight: 56,
    justifyContent: 'center',
    ...SHADOWS.base,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshProfileButton: {
    paddingVertical: SPACING.base,
    alignItems: 'center',
    marginTop: SPACING.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  refreshProfileText: {
    color: COLORS.accent,
    fontSize: FONTS.base,
    fontWeight: FONTS.medium,
  },
});

export default ProfileScreen;
