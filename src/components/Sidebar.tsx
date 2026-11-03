// Sidebar padrão (fixa no computador, menu lateral no celular) e cabeçalho compacto do celular
import type { DrawerContentComponentProps, DrawerHeaderProps } from 'expo-router/drawer';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useModals } from '@/components/Modals';
import { Icon, ProgressBar } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import type { IconName } from '@/lib/plan';
import { colors, radius, TOUCH } from '@/lib/theme';

export const SIDEBAR_LARGURA = 264;
export const SIDEBAR_FIXA_A_PARTIR_DE = 900;

const ITENS: { rota: 'plano' | 'tutor'; label: string; icon: IconName; iconOn: IconName }[] = [
  { rota: 'plano', label: 'Meu plano', icon: 'calendar-outline', iconOn: 'calendar' },
  { rota: 'tutor', label: 'Tutor IA', icon: 'chatbubble-ellipses-outline', iconOn: 'chatbubble-ellipses' },
];

export function Sidebar({ state, navigation, fixa }: DrawerContentComponentProps & { fixa: boolean }) {
  const { perfil, user, sair } = useSession();
  const { abrirUpgrade, abrirAnuncio } = useModals();
  const insets = useSafeAreaInsets();
  const atual = state.routes[state.index]?.name;
  const pro = perfil?.plan === 'pro';

  function ir(rota: string) {
    navigation.navigate(rota); // troca de tela sem recarregar (as duas ficam montadas)
    if (!fixa) navigation.closeDrawer();
  }

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.logo}>
        <Icon name="book" size={22} color={colors.primary} />
        <Text style={styles.logoText}>StudyTimeIA</Text>
      </View>

      <View style={{ gap: 4 }} role="navigation">
        {ITENS.map((it) => {
          const on = atual === it.rota;
          return (
            <Pressable
              key={it.rota}
              onPress={() => ir(it.rota)}
              accessibilityRole="link"
              aria-current={on ? 'page' : undefined}
              style={({ pressed }) => [styles.item, on && styles.itemOn, pressed && !on && { backgroundColor: colors.surface }]}
            >
              <Icon name={on ? it.iconOn : it.icon} size={20} color={on ? colors.primary : colors.textMuted} />
              <Text style={[styles.itemText, on && { color: colors.primary }]}>{it.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {perfil && (
        <View style={styles.plano}>
          <View style={styles.planoTopo}>
            <Text style={styles.planoTitulo}>{pro ? 'Plano Premium' : 'Plano Free'}</Text>
            <Text style={[styles.selo, pro ? styles.seloPro : styles.seloFree]}>{pro ? 'PRO' : 'FREE'}</Text>
          </View>
          {pro ? (
            <Text style={styles.planoTexto}>Estudo ilimitado, 7 dias por semana.</Text>
          ) : (
            <>
              <Text style={styles.planoTexto}>
                Hoje: {perfil.minutesToday} de {perfil.dailyLimit} min
              </Text>
              <ProgressBar pct={perfil.dailyLimit ? (perfil.minutesToday / perfil.dailyLimit) * 100 : 0} height={6} track={colors.border} />
              <Pressable onPress={abrirUpgrade} accessibilityRole="button" style={styles.acaoForte}>
                <Icon name="flash" size={16} color={colors.white} />
                <Text style={styles.acaoForteText}>Ver Premium</Text>
              </Pressable>
              {perfil.adsToday < perfil.adMaxPerDay && (
                <Pressable onPress={abrirAnuncio} accessibilityRole="button" style={styles.acao}>
                  <Icon name="play-circle-outline" size={16} color={colors.amberText} />
                  <Text style={styles.acaoText}>+{perfil.adBonus} min com anúncio</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      )}

      <View style={{ flex: 1 }} />

      <View style={styles.conta}>
        <Icon name="person-circle-outline" size={20} />
        <Text style={styles.email} numberOfLines={1}>
          {user?.email}
        </Text>
      </View>
      <Pressable onPress={sair} accessibilityRole="button" style={styles.item}>
        <Icon name="log-out-outline" size={20} />
        <Text style={styles.itemText}>Sair da conta</Text>
      </Pressable>
    </ScrollView>
  );
}

/** Cabeçalho do celular: botão ☰ (abre a sidebar), título da tela e plano atual. */
export function MobileHeader({ navigation, options }: DrawerHeaderProps) {
  const { perfil } = useSession();
  const { abrirUpgrade } = useModals();
  const insets = useSafeAreaInsets();
  const pro = perfil?.plan === 'pro';
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Pressable onPress={() => navigation.openDrawer()} accessibilityRole="button" accessibilityLabel="Abrir menu" style={styles.iconBtn}>
        <Icon name="menu" size={24} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitulo} numberOfLines={1}>
        {options.title}
      </Text>
      {perfil && !pro && (
        <Text style={styles.tempo} accessibilityLabel={`Tempo de estudo hoje: ${perfil.minutesToday} de ${perfil.dailyLimit} minutos`}>
          {perfil.minutesToday}/{perfil.dailyLimit} min
        </Text>
      )}
      <Pressable
        onPress={pro ? undefined : abrirUpgrade}
        accessibilityRole="button"
        accessibilityLabel={pro ? 'Plano Premium ativo' : 'Plano Free. Toque para ver o Premium'}
        style={[styles.selo, styles.seloBtn, pro ? styles.seloPro : styles.seloFree]}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', color: pro ? colors.white : colors.orangeText }}>{pro ? 'PRO' : 'FREE'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, paddingHorizontal: 12, gap: 16 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  logoText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH, paddingHorizontal: 12, borderRadius: radius.md },
  itemOn: { backgroundColor: colors.primarySoft },
  itemText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  plano: { gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  planoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planoTitulo: { fontSize: 14, fontWeight: '700', color: colors.text },
  planoTexto: { fontSize: 13, color: colors.textMuted },
  selo: { fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, overflow: 'hidden' },
  seloBtn: { minHeight: 32, minWidth: TOUCH, alignItems: 'center', justifyContent: 'center' },
  seloFree: { backgroundColor: colors.orangeSoft, color: colors.orangeText },
  seloPro: { backgroundColor: colors.primary, color: colors.white },
  acaoForte: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, borderRadius: radius.sm, backgroundColor: colors.primary, marginTop: 4 },
  acaoForteText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  acao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.amberBorder, backgroundColor: colors.amberSoft },
  acaoText: { color: colors.amberText, fontWeight: '700', fontSize: 13 },
  conta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  email: { flex: 1, fontSize: 13, color: colors.textMuted },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingRight: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 52 },
  iconBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  headerTitulo: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.dark },
  tempo: { fontSize: 12, fontWeight: '600', color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, overflow: 'hidden', marginRight: 6 },
});
