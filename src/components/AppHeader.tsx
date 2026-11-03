import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useSession } from '@/context/SessionContext';
import { colors, MAX_WIDTH, radius, TOUCH } from '@/lib/theme';

import { Icon } from './ui';

/** Cabeçalho das telas logadas: logo, plano (Free/PRO), atalho para o Tutor/Plano e sair. */
export function AppHeader({ onUpgrade, atual }: { onUpgrade?: () => void; atual: 'plano' | 'tutor' }) {
  const { perfil, sair } = useSession();
  const { width } = useWindowDimensions();
  const pro = perfil?.plan === 'pro';
  // Em celulares estreitos o contador sai do cabeçalho (ele aparece no Tutor)
  const tempo = perfil && !pro && width >= 420 ? `${perfil.minutesToday}/${perfil.dailyLimit} min` : null;

  return (
    <View style={styles.bar}>
      <View style={styles.inner}>
        <Pressable onPress={() => router.replace('/plano')} accessibilityRole="link" accessibilityLabel="StudyTimeIA, ir para o plano" style={styles.logo}>
          <Icon name="book" size={20} color={colors.primary} />
          <Text style={styles.logoText}>StudyTimeIA</Text>
        </Pressable>

        <View style={styles.actions}>
          {tempo && (
            <View style={styles.time} accessibilityLabel={`Tempo de estudo hoje: ${tempo}`}>
              <Icon name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.timeText}>{tempo}</Text>
            </View>
          )}
          <Pressable
            onPress={pro ? undefined : onUpgrade}
            accessibilityRole="button"
            accessibilityLabel={pro ? 'Plano Premium ativo' : 'Plano Free. Toque para ver o Premium'}
            style={[styles.badge, pro ? styles.badgePro : styles.badgeFree]}
          >
            <Text style={[styles.badgeText, { color: pro ? colors.white : colors.orangeText }]}>{pro ? 'PRO' : 'FREE'}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(atual === 'tutor' ? '/plano' : '/tutor')}
            accessibilityRole="link"
            accessibilityLabel={atual === 'tutor' ? 'Abrir meu plano' : 'Abrir o Tutor IA'}
            style={styles.iconBtn}
          >
            <Icon name={atual === 'tutor' ? 'calendar-outline' : 'chatbubble-ellipses-outline'} size={20} />
          </Pressable>
          <Pressable onPress={sair} accessibilityRole="button" accessibilityLabel="Sair da conta" style={styles.iconBtn}>
            <Icon name="log-out-outline" size={20} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  inner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 12,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: TOUCH, paddingHorizontal: 4, flexShrink: 1 },
  logoText: { color: colors.primary, fontWeight: '800', fontSize: 17 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, marginRight: 4 },
  timeText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  badge: { minHeight: 32, minWidth: TOUCH, paddingHorizontal: 8, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  badgeFree: { backgroundColor: colors.orangeSoft },
  badgePro: { backgroundColor: colors.primary },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  iconBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
});
