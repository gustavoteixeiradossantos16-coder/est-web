// Página inicial (deslogado). Quem já está logado vai direto para o plano.
import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Icon, Loading, Screen } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, MAX_WIDTH, radius, TOUCH } from '@/lib/theme';

export default function Landing() {
  const { carregando, user } = useSession();
  if (carregando) return <Loading texto="Carregando sua conta…" />;
  if (user) return <Redirect href="/plano" />;

  const header = (
    <View style={styles.nav}>
      <Text style={styles.logo}>StudyTimeIA</Text>
      <Pressable onPress={() => router.push('/auth')} accessibilityRole="link" style={styles.navBtn}>
        <Text style={styles.navText}>Entrar</Text>
      </Pressable>
    </View>
  );

  return (
    <Screen header={header}>
      <View style={styles.hero}>
        <Text style={styles.h1} role="heading">
          Aprove sua vaga com <Text style={{ color: colors.primary }}>Inteligência Artificial</Text>
        </Text>
        <Text style={styles.lead}>
          O StudyTimeIA analisa as provas dos últimos 15 anos do seu concurso, monta um cronograma sob medida e
          tira suas dúvidas com um tutor IA 24 horas por dia.
        </Text>
        <Button
          label="Começar a estudar grátis"
          onPress={() => router.push({ pathname: '/auth', params: { modo: 'cadastro' } })}
          style={styles.cta}
        />
      </View>

      <View style={styles.passos}>
        {[
          { n: '1', t: 'Conte seu objetivo', d: 'Concurso, dias da semana e tempo disponível.' },
          { n: '2', t: 'A IA analisa as provas', d: 'Descobre o que mais cai e monta o cronograma.' },
          { n: '3', t: 'Estude com 1 clique', d: 'Cada matéria abre o Tutor IA já no assunto certo.' },
        ].map((p) => (
          <View key={p.n} style={styles.passo}>
            <Text style={styles.passoN}>{p.n}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.passoT}>{p.t}</Text>
              <Text style={styles.passoD}>{p.d}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.planos}>
        <View style={styles.plano}>
          <Text style={styles.planoNome}>Plano Gratuito</Text>
          <Text style={styles.planoSub}>Para quem está começando</Text>
          <Text style={styles.preco}>
            R$ 0<Text style={styles.mes}>/mês</Text>
          </Text>
          {['Tutor IA especialista', '30 minutos de estudo por dia', 'Até 4 dias por semana'].map((t) => (
            <Item key={t} texto={t} />
          ))}
        </View>
        <View style={[styles.plano, styles.planoPro]}>
          <Text style={styles.recomendado}>RECOMENDADO</Text>
          <Text style={[styles.planoNome, { color: colors.white }]}>Plano Premium</Text>
          <Text style={[styles.planoSub, { color: '#cbd5e1' }]}>Foco total na aprovação</Text>
          <Text style={[styles.preco, { color: colors.white }]}>
            R$ 29,90<Text style={[styles.mes, { color: '#cbd5e1' }]}>/mês</Text>
          </Text>
          {['Acesso ilimitado à IA', 'Estude os 7 dias da semana', 'Questões de provas anteriores'].map((t) => (
            <Item key={t} texto={t} claro />
          ))}
        </View>
      </View>
    </Screen>
  );
}

function Item({ texto, claro }: { texto: string; claro?: boolean }) {
  return (
    <View style={styles.item}>
      <Icon name="checkmark-circle" size={18} color={claro ? '#a5b4fc' : colors.primary} />
      <Text style={[styles.itemText, claro && { color: colors.white }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  logo: { fontSize: 20, fontWeight: '800', color: colors.primary },
  navBtn: { minHeight: TOUCH, minWidth: TOUCH, paddingHorizontal: 12, justifyContent: 'center', marginRight: -12 },
  navText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  hero: { paddingTop: 32, paddingBottom: 24, alignItems: 'center' },
  h1: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: colors.dark, textAlign: 'center', maxWidth: 640 },
  lead: { fontSize: 17, lineHeight: 26, color: colors.textMuted, textAlign: 'center', marginTop: 16, maxWidth: 560 },
  cta: { marginTop: 28, borderRadius: radius.full, paddingHorizontal: 28, minHeight: 56 },
  passos: { gap: 10, marginBottom: 28, flexDirection: 'row', flexWrap: 'wrap' },
  passo: {
    flexGrow: 1,
    flexBasis: 260,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
  },
  passoN: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },
  passoT: { fontWeight: '700', color: colors.text, fontSize: 15 },
  passoD: { color: colors.textMuted, fontSize: 13, marginTop: 2, lineHeight: 18 },
  planos: { gap: 16, flexDirection: 'row', flexWrap: 'wrap' },
  plano: {
    flexGrow: 1,
    flexBasis: 280,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 10,
  },
  planoPro: { backgroundColor: colors.dark, borderColor: colors.primary, overflow: 'hidden' },
  recomendado: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: radius.sm,
  },
  planoNome: { fontSize: 22, fontWeight: '700', color: colors.dark, textAlign: 'center' },
  planoSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  preco: { fontSize: 34, fontWeight: '800', color: colors.dark, textAlign: 'center', marginVertical: 6 },
  mes: { fontSize: 16, fontWeight: '400', color: colors.textSubtle },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemText: { fontSize: 15, color: colors.text },
});
