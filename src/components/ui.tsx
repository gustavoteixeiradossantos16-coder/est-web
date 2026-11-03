// Componentes visuais reutilizados em todas as telas
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { IconName } from '@/lib/plan';
import { colors, MAX_WIDTH, radius, TOUCH } from '@/lib/theme';

export function Icon({ name, size = 18, color = colors.textMuted }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

/** Tela com rolagem, margem de 16 px no celular e largura máxima no computador. */
export function Screen({ children, header, scroll = true }: { children: ReactNode; header?: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.container, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

type Variante = 'primary' | 'dark' | 'outline' | 'ghost' | 'amber';

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  loading,
  disabled,
  style,
  small,
  accessibilityLabel,
}: {
  label: string;
  onPress?: PressableProps['onPress'];
  icon?: IconName;
  variant?: Variante;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
  accessibilityLabel?: string;
}) {
  const v = VARIANTES[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: pressed && !off ? v.pressed : v.bg, borderColor: v.border },
        off && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={v.fg} /> : icon ? <Icon name={icon} size={18} color={v.fg} /> : null}
      <Text style={[styles.btnText, small && { fontSize: 14 }, { color: v.fg }]}>{label}</Text>
    </Pressable>
  );
}

const VARIANTES: Record<Variante, { bg: string; pressed: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, pressed: colors.primaryDark, fg: colors.white, border: colors.primary },
  dark: { bg: colors.dark, pressed: '#000', fg: colors.white, border: colors.dark },
  outline: { bg: colors.white, pressed: colors.surface, fg: colors.textMuted, border: colors.borderStrong },
  ghost: { bg: 'transparent', pressed: colors.surface, fg: colors.textMuted, border: 'transparent' },
  amber: { bg: colors.amber, pressed: '#d97706', fg: colors.white, border: colors.amber },
};

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function B({ children }: { children: ReactNode }) {
  return <Text style={{ fontWeight: '700', color: colors.text }}>{children}</Text>;
}

/** Caixinha de explicação ("Por que isso importa?") usada para deixar as telas mais didáticas. */
export function Dica({ titulo, children, icon = 'bulb-outline' }: { titulo?: string; children: ReactNode; icon?: IconName }) {
  return (
    <View style={styles.dica}>
      <Icon name={icon} size={18} color={colors.primary} />
      <Text style={styles.dicaText}>
        {titulo ? <Text style={{ fontWeight: '700', color: colors.text }}>{titulo} </Text> : null}
        {children}
      </Text>
    </View>
  );
}

export function Tag({ label, bg, fg, icon }: { label: string; bg: string; fg: string; icon?: IconName }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={12} color={fg} /> : null}
      <Text style={[styles.tagText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ pct, color = colors.primary, height = 8, track = colors.surface }: { pct: number; color?: string; height?: number; track?: string }) {
  return (
    <View style={{ height, borderRadius: radius.full, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height, borderRadius: radius.full, backgroundColor: color }} />
    </View>
  );
}

export function Loading({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Muted>{texto}</Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  container: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16 },
  btn: {
    minHeight: TOUCH + 4,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSmall: { minHeight: TOUCH, paddingHorizontal: 14 },
  btnText: { fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 18 },
  title: { fontSize: 18, fontWeight: '700', color: colors.dark },
  muted: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  dica: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: '#eef2ff99',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  dicaText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  tagText: { fontSize: 12, fontWeight: '600' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 96 },
});
