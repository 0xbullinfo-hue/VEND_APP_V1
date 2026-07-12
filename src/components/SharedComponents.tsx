import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  View, 
  ActivityIndicator, 
  Platform,
  Image,
} from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, IonIconName } from './VIcons';
import { theme, normalize } from '../theme/designSystem';
import { useApp } from '../contexts/AppContext';

// VText component
export const VText: React.FC<{
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'subtext' | 'caption';
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: any;
  children: React.ReactNode;
  numberOfLines?: number;
}> = ({ 
  variant = 'body', 
  color, 
  align = 'left', 
  style, 
  children,
  numberOfLines 
}) => {
  const textStyle = theme.typography[variant];
  const defaultColor = variant === 'caption' || variant === 'subtext' 
    ? theme.colors.textMuted 
    : theme.colors.textMain;

  return (
    <Text 
      numberOfLines={numberOfLines}
      style={[
        { 
          fontFamily: textStyle.fontFamily || (variant === 'h1' || variant === 'h2' ? theme.typography.fontDisplay : theme.typography.fontSans),
          fontSize: textStyle.fontSize,
          letterSpacing: (textStyle as any).letterSpacing || 0,
          lineHeight: (textStyle as any).lineHeight || undefined,
          color: color || defaultColor,
          textAlign: align,
        },
        style
      ]}
    >
      {children}
    </Text>
  );
};

// Premium Action Button
export const VButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  icon, 
  loading = false, 
  disabled = false, 
  style,
  textStyle 
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.primary,
          border: theme.colors.primary,
          text: theme.colors.background,
        };
      case 'secondary':
        return {
          bg: theme.colors.primaryLight,
          border: theme.colors.primaryLight,
          text: theme.colors.primary,
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: theme.colors.primary,
          text: theme.colors.primary,
        };
      case 'danger':
        return {
          bg: theme.colors.danger,
          border: theme.colors.danger,
          text: theme.colors.background,
        };
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;
    onPress();
  };

  const currentStyles = getStyles();
  const opacity = disabled || loading ? 0.6 : 1;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.btn,
        {
          backgroundColor: currentStyles.bg,
          borderColor: currentStyles.border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity,
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={currentStyles.text} size="small" />
      ) : (
        <View style={styles.btnContent}>
          {icon && (
            <Ionicons 
              name={icon as IonIconName}
              size={normalize(18)} 
              color={currentStyles.text} 
              style={{ marginRight: theme.spacing.sm }} 
            />
          )}
          <Text 
            style={[
              styles.btnText, 
              { 
                color: currentStyles.text, 
                fontFamily: theme.typography.fontSans,
                fontSize: normalize(14)
              },
              textStyle
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Premium TextInput
export const VInput: React.FC<{
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
  secureTextEntry?: boolean;
  icon?: string;
  style?: any;
  maxLength?: number;
}> = ({ 
  placeholder, 
  value, 
  onChangeText, 
  keyboardType = 'default', 
  secureTextEntry = false, 
  icon,
  style,
  maxLength
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      {icon && (
        <Ionicons 
          name={icon as IonIconName}
          size={normalize(20)} 
          color={theme.colors.textMuted} 
          style={styles.inputIcon} 
        />
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        style={[styles.input, { fontFamily: theme.typography.fontSans }]}
      />
    </View>
  );
};

// Header Point Widget
export const PointWidget: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const { points } = useApp();

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={handlePress}
      style={styles.pointsBadge}
    >
      <Ionicons name="star" size={normalize(14)} color="#F59E0B" style={{ marginRight: 4 }} />
      <VText variant="caption" color={theme.colors.primary}>
        {points} PTS
      </VText>
    </TouchableOpacity>
  );
};

// Custom App Header
export const HeaderBar: React.FC<{
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showPoints?: boolean;
  onPointsPress?: () => void;
  rightComponent?: React.ReactNode;
  style?: any;
}> = ({
  title,
  showBack = false,
  onBack,
  showPoints = true,
  onPointsPress,
  rightComponent,
  style
}) => {
  const { locality } = useApp();

  return (
    <SafeAreaView style={[styles.headerSafeArea, style]}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          {showBack && onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={normalize(24)} color={theme.colors.textMain} />
            </TouchableOpacity>
          ) : (
            <View style={styles.localityContainer}>
              <Ionicons name="location" size={normalize(16)} color={theme.colors.primary} />
              <VText variant="subtext" style={{ marginLeft: 4 }}>
                {locality ? locality.name : 'Select Locality'}
              </VText>
            </View>
          )}
        </View>
        
        {title && (
          <View style={styles.headerCenter}>
            <VText variant="h3" align="center" numberOfLines={1}>
              {title}
            </VText>
          </View>
        )}
        
        <View style={styles.headerRight}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showPoints && <PointWidget onPress={onPointsPress} />}
            {rightComponent && (
              <View style={{ marginLeft: theme.spacing.xs }}>
                {rightComponent}
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Toast notification for Points and general alerts
export const NotificationToast: React.FC = () => {
  const { notification, dismissNotification } = useApp();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        dismissNotification();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, dismissNotification]);

  if (!notification) return null;

  const isSOS = notification.includes("🚨");

  return (
    <View style={[
      styles.toastContainer, 
      isSOS ? styles.sosToast : styles.normalToast,
      theme.shadows.premium
    ]}>
      <Ionicons 
        name={isSOS ? "alert-circle" : "sparkles"} 
        size={normalize(20)} 
        color={isSOS ? theme.colors.background : theme.colors.primary} 
        style={{ marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={[
          styles.toastText,
          { color: isSOS ? theme.colors.background : theme.colors.textMain }
        ]}>
          {notification}
        </Text>
      </View>
      <TouchableOpacity onPress={dismissNotification}>
        <Ionicons 
          name="close" 
          size={normalize(18)} 
          color={isSOS ? theme.colors.background : theme.colors.textMuted} 
        />
      </TouchableOpacity>
    </View>
  );
};

// Premium Image component with professional placeholder logic
export const VImage: React.FC<{
  source: any;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch';
}> = ({ source, style, resizeMode = 'cover' }) => {
  const [error, setError] = React.useState(false);

  // Determine the final image source with fallback logic
  const getImageSource = () => {
    if (error || !source) {
      return require('../../assets/images/placeholder-vendor.png');
    }
    if (typeof source === 'string') {
      return { uri: source };
    }
    return source;
  };

  return (
    <Image
      source={getImageSource()}
      style={style}
      resizeMode={resizeMode}
      onError={() => setError(true)}
    />
  );
};

// Consolidated Card component for UI consistency
export const VCard: React.FC<{
  children: React.ReactNode;
  variant?: 'elevated' | 'outline' | 'flat';
  style?: any;
  onPress?: () => void;
}> = ({ children, variant = 'elevated', style, onPress }) => {
  const variantStyle = variant === 'elevated'
    ? theme.shadows.soft
    : variant === 'outline'
      ? { borderWidth: 1, borderColor: theme.colors.border }
      : {};

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.cardBase,
          variantStyle,
          style
        ]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.cardBase,
        variantStyle,
        style
      ]}
    >
      {children}
    </View>
  );
};

// Pulsing "Live Now" indicator
export const VPulse: React.FC<{ size?: number; color?: string; style?: any }> = ({
  size = 12,
  color = theme.colors.accent,
  style
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    ),
    transform: [
      {
        scale: withRepeat(
          withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(1.3, { duration: 1000 })
          ),
          -1,
          true
        ),
      },
    ],
  }));

  return (
    <View style={[styles.pulseContainer, { width: size, height: size }, style]}>
      <Animated.View
        style={[
          styles.pulseCircle,
          { backgroundColor: color, borderRadius: size / 2 },
          animatedStyle
        ]}
      />
      <View style={[styles.pulseDot, { backgroundColor: color, borderRadius: size / 4, width: size / 2, height: size / 2 }]} />
    </View>
  );
};

// Skeleton loader component for premium loading states
export const VSkeleton: React.FC<{
  width?: any;
  height?: any;
  borderRadius?: number;
  style?: any;
}> = ({ width = '100%', height = 20, borderRadius = 8, style }) => {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB', // theme.colors.border
          opacity: 0.6
        },
        style
      ]}
    />
  );
};

// Unified Pending/Error State for Vendor Profiles
export const VendorProfilePendingState: React.FC<{
  title?: string;
  message?: string;
  icon?: IonIconName;
  onBack?: () => void;
  actionTitle?: string;
  onAction?: () => void;
}> = ({
  title = 'Vendor Not Found',
  message = 'This vendor is no longer available in your current locality feed.',
  icon = 'alert-circle-outline',
  onBack,
  actionTitle = 'Back',
  onAction
}) => {
  return (
    <View style={styles.pendingContainer}>
      {onBack && <HeaderBar showBack={true} onBack={onBack} />}
      <View style={styles.pendingContent}>
        <Ionicons
          name={icon as IonIconName}
          size={normalize(48)}
          color={theme.colors.warning}
          style={{ marginBottom: theme.spacing.md }}
        />
        <VText variant="h2" align="center" style={{ marginBottom: theme.spacing.sm }}>
          {title}
        </VText>
        <VText variant="body" align="center" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.xl }}>
          {message}
        </VText>
        {(onAction || onBack) && (
          <VButton
            title={onAction ? actionTitle : 'Back'}
            onPress={onAction || onBack || (() => {})}
            style={{ width: '100%' }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: normalize(48),
    borderRadius: normalize(12),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontWeight: '700',
  },
  inputContainer: {
    height: normalize(48),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: normalize(12),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.textMain,
    fontSize: normalize(14),
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(17, 92, 85, 0.1)',
  },
  headerSafeArea: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContainer: {
    height: normalize(52),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  localityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: normalize(12),
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
  },
  normalToast: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
  },
  sosToast: {
    backgroundColor: theme.colors.danger,
  },
  toastText: {
    fontSize: normalize(13),
    fontWeight: '700',
  },
  cardBase: {
    backgroundColor: theme.colors.background,
    borderRadius: normalize(16),
    padding: theme.spacing.lg,
  },
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  pulseDot: {
    zIndex: 1,
  },
  pendingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  pendingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});
