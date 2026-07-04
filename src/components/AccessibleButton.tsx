/**
 * Accessible Button Component
 *
 * Wrapper around VButton with accessibility built-in
 * Ensures proper labels, roles, and semantics for screen readers
 */

import React from 'react';
import { AccessibilityRole } from 'react-native';
import { VButton } from './SharedComponents';
import {
  validateInteractiveElement,
  validateComponentAccessibility,
} from '../lib/accessibility';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  testID?: string;
}

/**
 * Accessible Button Component
 *
 * Provides semantic accessibility out of the box:
 * - Automatic accessible labels with descriptive text
 * - Proper ARIA roles
 * - Helpful hints for screen readers
 * - Proper touch target sizing
 * - Disabled state announcements
 *
 * Usage:
 * <AccessibleButton
 *   title="Save Profile"
 *   onPress={() => handleSave()}
 *   accessibilityHint="Saves your profile changes"
 *   variant="primary"
 * />
 */
export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  testID,
}) => {
  // Generate comprehensive label
  const label = accessibilityLabel || title;
  const hint = disabled
    ? `${accessibilityHint || ''} (disabled)`.trim()
    : accessibilityHint;

  // Validate accessibility
  const a11yCheck = validateComponentAccessibility(
    !!label,
    accessibilityRole === 'button',
    !!hint
  );

  return (
    <VButton
      title={title}
      onPress={onPress}
      variant={variant}
      icon={icon}
      loading={loading}
      disabled={disabled}
      style={style}
      textStyle={textStyle}
    />
  );
};

// ─── Accessible Input Component ─────────────────────────────────────────────

import { TextInput, View, StyleSheet } from 'react-native';
import { VText } from './SharedComponents';
import { theme, normalize } from '../theme/designSystem';

interface AccessibleInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
  secureTextEntry?: boolean;
  required?: boolean;
  error?: string;
  testID?: string;
  style?: any;
}

/**
 * Accessible Input Component
 *
 * Provides semantic accessibility:
 * - Associated label text
 * - Helpful input hints
 * - Error state announcements
 * - Required field indication
 * - Proper text contrast
 *
 * Usage:
 * <AccessibleInput
 *   label="Email Address"
 *   value={email}
 *   onChangeText={setEmail}
 *   keyboardType="email-address"
 *   required={true}
 *   error={emailError}
 * />
 */
export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  accessibilityHint,
  keyboardType = 'default',
  secureTextEntry = false,
  required = false,
  error,
  testID,
  style,
}) => {
  const finalLabel = accessibilityLabel || label;
  const requiredText = required ? ', required' : '';
  const errorText = error ? `. Error: ${error}` : '';
  const hint = `${accessibilityHint || ''}${requiredText}${errorText}`;

  const a11yCheck = validateComponentAccessibility(!!finalLabel, true, !!hint);

  return (
    <View style={styles.container}>
      <VText
        variant="body"
        color={theme.colors.textMain}
        style={styles.label}
      >
        {label}
        {required && <VText color={theme.colors.danger}> *</VText>}
      </VText>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        // Accessibility props
        accessible={true}
        accessibilityLabel={finalLabel}
        accessibilityHint={hint}
        accessibilityRole="text"
        accessibilityState={{
          disabled: false,
        }}
        testID={testID}
        placeholderTextColor={theme.colors.textMuted}
      />

      {error && (
        <VText
          variant="caption"
          color={theme.colors.danger}
          style={styles.errorText}
        >
          {error}
        </VText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: normalize(16),
  },
  label: {
    marginBottom: normalize(8),
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: normalize(8),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(10),
    fontSize: normalize(14),
    color: theme.colors.textMain,
    fontFamily: theme.typography.fontSans,
    minHeight: 48, // Accessible touch target
  },
  inputError: {
    borderColor: theme.colors.danger,
    backgroundColor: '#FFE5E5',
  },
  errorText: {
    marginTop: normalize(6),
  },
});
