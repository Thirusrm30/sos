import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../utils/constants';

const Input = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder,
  error,
  helperText,
  icon,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  editable = true,
  style,
  inputStyle,
  onIconPress,
  rightIcon,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return COLORS.danger;
    if (isFocused) return COLORS.accent;
    return COLORS.border;
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[styles.inputContainer, { borderColor: getBorderColor() }]}>
        {icon && (
          <TouchableOpacity onPress={onIconPress} style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </TouchableOpacity>
        )}
        
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            icon && styles.inputWithIcon,
            rightIcon && styles.inputWithRightIcon,
            !editable && styles.disabled,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            <Text style={styles.rightIcon}>{rightIcon}</Text>
          </View>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: FONTS.md,
    fontWeight: FONTS.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderRadius: RADIUS.base,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    padding: SPACING.md,
    fontSize: FONTS.base,
    color: COLORS.text,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    paddingLeft: SPACING.xs,
  },
  inputWithRightIcon: {
    paddingRight: SPACING.xs,
  },
  iconContainer: {
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  rightIconContainer: {
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    fontSize: 20,
  },
  helperText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  errorText: {
    color: COLORS.danger,
  },
  disabled: {
    backgroundColor: COLORS.surfaceSecondary,
    opacity: 0.6,
  },
});

export default Input;
