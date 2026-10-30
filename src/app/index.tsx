import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Check, Logo } from '@/components/ui';
import { FREE_DAYS_PER_WEEK, FREE_MINUTES_PER_DAY, PREMIUM_PRICE } from '@/lib/plan';
import { colors } from '@/lib/theme';

export default function LandingScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.nav}>
        <Logo />
        <Pressable onPress={() => router.push('/auth')} hitSlop={12}>
          <Text style={styles.navLink}>Entrar</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          Aprove sua vaga com <Text style={{ color: colors.primary }}>Inteligência Artificial</Text>
        </Text>
        <Text style={styles.subtitle}>
          O StudyTimeIA é seu tutor particular 24 horas por dia. Tire dúvidas, resuma editais, gere questões e estude
          com foco total.
        </Text>

        <Button
          title="Começar a Estudar Grátis"
          icon="arrow-forward"
          onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })}
          style={styles.cta}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plano Gratuito</Text>
          <Text style={styles.cardSubtitle}>Para quem está começando</Text>
          <Text style={styles.price}>
            R$ 0<Text style={styles.priceUnit}>/mês</Text>
          </Text>
          <View style={styles.list}>
            <Check>Tutor IA Especialista</Check>
            <Check icon="time-outline" color={colors.orange}>
              {FREE_MINUTES_PER_DAY} minutos de estudo/dia
            </Check>
            <Check icon="calendar-outline" color={colors.orange}>
              {FREE_DAYS_PER_WEEK} dias por semana
            </Check>
          </View>
        </View>

        <View style={[styles.card, styles.cardDark]}>
          <Text style={styles.badge}>RECOMENDADO</Text>
          <Text style={[styles.cardTitle, { color: colors.white }]}>Plano Premium</Text>
          <Text style={[styles.cardSubtitle, { color: colors.borderStrong }]}>Foco total na aprovação</Text>
          <Text style={[styles.price, { color: colors.white }]}>
            {PREMIUM_PRICE}
            <Text style={styles.priceUnit}>/mês</Text>
          </Text>
          <View style={styles.list}>
            <Check color={colors.primary} textColor={colors.border}>
              Acesso ilimitado à IA
            </Check>
            <Check icon="infinite" color={colors.primary} textColor={colors.border}>
              Horas de estudo ilimitadas
            </Check>
            <Check color={colors.primary} textColor={colors.border}>
              7 dias por semana
            </Check>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navLink: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  content: { padding: 20, paddingBottom: 48, gap: 20, maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: colors.dark, textAlign: 'center', marginTop: 24, lineHeight: 42 },
  subtitle: { fontSize: 17, color: colors.textMuted, textAlign: 'center', lineHeight: 25 },
  cta: { borderRadius: 999, marginVertical: 8 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border },
  cardDark: { backgroundColor: colors.dark, borderColor: colors.primary, overflow: 'hidden' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: colors.dark, marginBottom: 4 },
  cardSubtitle: { color: colors.textMuted, marginBottom: 16 },
  price: { fontSize: 34, fontWeight: '800', color: colors.dark, marginBottom: 16 },
  priceUnit: { fontSize: 16, fontWeight: '400', color: colors.textSubtle },
  list: { gap: 10 },
});
