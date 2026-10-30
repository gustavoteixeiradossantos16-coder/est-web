import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Logo({ size = 20 }: { size?: number }) {
  return (
    <View style={styles.logo}>
      <Ionicons name="book-outline" size={size + 2} color={colors.primary} />
      <Text style={[styles.logoText, { fontSize: size }]}>StudyTimeIA</Text>
    </View>
  );
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'ghost';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style }: ButtonProps) {
  const textColor = variant === 'ghost' ? colors.textMuted : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: pressed ? colors.primaryDark : colors.primary },
        variant === 'dark' && { backgroundColor: pressed ? '#000' : colors.dark },
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
          {icon && <Ionicons name={icon} size={18} color={textColor} />}
        </>
      )}
    </Pressable>
  );
}

export function Check({ children, icon = 'checkmark', color = colors.green, textColor = colors.text }: {
  children: ReactNode;
  icon?: IconName;
  color?: string;
  textColor?: string;
}) {
  return (
    <View style={styles.check}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ color: textColor, fontSize: 15, flexShrink: 1 }}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: colors.primary, fontWeight: '700' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
