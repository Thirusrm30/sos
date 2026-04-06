import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const result = await getUserProfile();
      if (result.success && result.user) {
        setName(result.user.name || '');
        setPhone(result.user.phone || '');
        setEmergencyContacts(result.user.emergencyContacts || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    setSaving(true);
    try {
      const result = await registerUser(name, phone, emergencyContacts);
      if (result.success) {
        Alert.alert('✅ Success', 'Profile saved successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to save profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Required', 'Please enter contact name and phone');
      return;
    }

    const newContact = {
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      relation: newContactRelation
    };

    setEmergencyContacts([...emergencyContacts, newContact]);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRelation('Family');
    
    Alert.alert('✅ Added', 'Contact added! Click Save to store.');
  };

  const handleRemoveContact = (index) => {
    const updated = emergencyContacts.filter((_, i) => i !== index);
    setEmergencyContacts(updated);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Your Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
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
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <Text style={styles.sectionSubtitle}>
            These contacts will receive alerts when you trigger SOS or don't mark yourself safe
          </Text>

          {emergencyContacts.map((contact, index) => (
            <View key={index} style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
                <Text style={styles.contactRelation}>{contact.relation}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveContact(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {emergencyContacts.length === 0 && (
            <View style={styles.emptyContacts}>
              <Text style={styles.emptyContactsText}>
                No emergency contacts added yet
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
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <Text style={styles.saveButtonText}>💾 Save Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
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
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
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
  },
  contactRelation: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.sm,
    borderRadius: RADIUS.base,
  },
  removeButtonText: {
    color: COLORS.danger,
    fontWeight: FONTS.bold,
  },
  emptyContacts: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyContactsText: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
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
});

export default ProfileScreen;
