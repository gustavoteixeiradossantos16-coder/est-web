// Tutor IA (chat). Se veio de "Estudar com a IA" no plano, já envia o pedido sozinho.
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { Markdown } from '@/components/Markdown';
import { AdModal, UpgradeModal } from '@/components/Modals';
import { Button, Card, Icon, Loading, Muted } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { api, ApiError } from '@/lib/api';
import type { Atividade, MensagemIA } from '@/lib/types';
import { colors, MAX_WIDTH, radius, TOUCH } from '@/lib/theme';

interface Msg {
  id: number;
  autor: 'user' | 'ia';
  texto: string;
}

const BOAS_VINDAS = 'Olá! Sou o tutor IA do StudyTimeIA. Estou aqui para ajudar você a conquistar sua vaga. Que matéria de edital vamos estudar hoje?';

export default function Tutor() {
  const { carregando, user, perfil, setPerfil, recarregarPerfil } = useSession();
  const params = useLocalSearchParams<{ materia?: string; assunto?: string; atividade?: string; minutos?: string }>();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, autor: 'ia', texto: BOAS_VINDAS }]);
  const [historico, setHistorico] = useState<MensagemIA[]>([]);
  const [texto, setTexto] = useState('');
  // Se veio de um botão do plano, já começa mostrando "Preparando…"
  const [esperando, setEsperando] = useState<string | null>(() =>
    params.materia?.trim() ? `Preparando seu estudo de ${params.materia.trim()}…` : null,
  );
  const [sessao, setSessao] = useState(0);
  const [upgrade, setUpgrade] = useState(false);
  const [anuncio, setAnuncio] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const enviouEstudo = useRef(false);
  const proxId = useRef(1);

  const limite = !!perfil?.limitReached;
  const pro = perfil?.plan === 'pro';

  const adicionar = (autor: Msg['autor'], t: string) => setMsgs((m) => [...m, { id: proxId.current++, autor, texto: t }]);

  const tratarErro = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.codigo === 'LIMITE_DIARIO') recarregarPerfil();
      adicionar('ia', e instanceof Error ? `⚠️ ${e.message}` : '⚠️ Desculpe, ocorreu um erro de conexão. Tente novamente.');
    },
    [recarregarPerfil],
  );

  // Veio de um botão de matéria do plano: o servidor monta o pedido e já responde
  useEffect(() => {
    const materia = params.materia?.trim();
    if (!perfil || !materia || enviouEstudo.current) return;
    enviouEstudo.current = true;
    router.setParams({ materia: undefined, assunto: undefined, atividade: undefined, minutos: undefined }); // não reenviar ao recarregar
    const atividade = (['teoria', 'questoes', 'revisao'] as const).includes(params.atividade as Atividade) ? (params.atividade as Atividade) : 'teoria';
    const tarefa = perfil.limitReached
      ? Promise.resolve() // limite do dia: o aviso de limite já aparece no lugar do campo de texto
      : api
          .chatEstudo({ materia, assunto: params.assunto, atividade, minutos: Number(params.minutos) || 0 })
          .then((r) => {
            adicionar('user', r.mensagem);
            adicionar('ia', r.resposta);
            setHistorico(r.historico);
          })
          .catch(tratarErro);
    tarefa.finally(() => setEsperando(null));
  }, [perfil, params.materia, params.assunto, params.atividade, params.minutos, tratarErro]);

  // Plano Free: conta 1 minuto de estudo por minuto com o Tutor aberto
  useFocusEffect(
    useCallback(() => {
      if (!perfil || pro || limite) return;
      const t = setInterval(() => {
        setSessao((s) => s + 1);
        api.somarMinuto().then(setPerfil).catch(() => {});
      }, 60_000);
      return () => clearInterval(t);
    }, [perfil, pro, limite, setPerfil]),
  );

  if (carregando) return <Loading texto="Carregando sua conta…" />;
  if (!user) return <Redirect href="/" />;

  async function enviar() {
    const t = texto.trim();
    if (!t || esperando || limite) return;
    setTexto('');
    adicionar('user', t);
    setEsperando('Digitando…');
    try {
      const r = await api.chat(t, historico);
      adicionar('ia', r.resposta);
      setHistorico(r.historico);
    } catch (e) {
      tratarErro(e);
    } finally {
      setEsperando(null);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right', 'bottom']}>
      <AppHeader atual="tutor" onUpgrade={() => setUpgrade(true)} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.lista} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
          {!pro && perfil && (
            <Text style={styles.sessao}>
              Sessão: {sessao} min · Hoje: {perfil.minutesToday}/{perfil.dailyLimit} min
            </Text>
          )}
          {msgs.map((m) => (
            <View key={m.id} style={[styles.linha, m.autor === 'user' && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.avatar, { backgroundColor: m.autor === 'user' ? colors.text : colors.primary }]}>
                <Icon name={m.autor === 'user' ? 'person' : 'sparkles'} size={16} color={colors.white} />
              </View>
              <View style={[styles.bolha, m.autor === 'user' ? styles.bolhaUser : styles.bolhaIA]}>
                <Markdown texto={m.texto} cor={m.autor === 'user' ? colors.white : colors.text} />
              </View>
            </View>
          ))}
          {esperando && (
            <View style={styles.linha} accessibilityLiveRegion="polite">
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Icon name="sparkles" size={16} color={colors.white} />
              </View>
              <View style={[styles.bolha, styles.bolhaIA, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>{esperando}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {limite ? (
          <View style={styles.rodape}>
            <Card style={{ gap: 10, alignItems: 'center' }}>
              <Icon name="time-outline" size={28} color={colors.orangeText} />
              <Text style={{ fontWeight: '800', fontSize: 17, color: colors.dark, textAlign: 'center' }}>Limite diário atingido</Text>
              <Muted style={{ textAlign: 'center' }}>
                Você usou seus {perfil?.dailyLimit} minutos de hoje no plano Free. Ganhe mais tempo assistindo a um anúncio ou faça upgrade.
              </Muted>
              <Button label="Fazer upgrade para Premium" onPress={() => setUpgrade(true)} style={{ alignSelf: 'stretch' }} />
              {perfil && perfil.adsToday < perfil.adMaxPerDay && (
                <Button label={`Assistir anúncio (+${perfil.adBonus} min)`} icon="play-circle-outline" variant="outline" onPress={() => setAnuncio(true)} style={{ alignSelf: 'stretch' }} />
              )}
              <Button label="Voltar ao meu plano" variant="ghost" small onPress={() => router.replace('/plano')} />
            </Card>
          </View>
        ) : (
          <View style={styles.rodape}>
            <View style={styles.inputBox}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder="Digite sua dúvida de concurso aqui…"
                placeholderTextColor={colors.textSubtle}
                multiline
                maxLength={4000}
                style={styles.input}
                accessibilityLabel="Mensagem para o Tutor IA"
                onKeyPress={(e) => {
                  // No navegador: Enter envia, Shift+Enter quebra linha
                  const ev = e.nativeEvent as unknown as { key: string; shiftKey?: boolean; preventDefault?: () => void };
                  if (Platform.OS === 'web' && ev.key === 'Enter' && !ev.shiftKey) {
                    (e as unknown as { preventDefault: () => void }).preventDefault();
                    enviar();
                  }
                }}
              />
              <Pressable onPress={enviar} disabled={!texto.trim() || !!esperando} accessibilityRole="button" accessibilityLabel="Enviar" style={[styles.enviar, (!texto.trim() || !!esperando) && { opacity: 0.4 }]}>
                <Icon name="send" size={18} color={colors.white} />
              </Pressable>
            </View>
            <Text style={styles.aviso}>As respostas são geradas por IA e devem ser conferidas no material oficial do concurso.</Text>
          </View>
        )}
      </KeyboardAvoidingView>
      <UpgradeModal visible={upgrade} onClose={() => setUpgrade(false)} />
      <AdModal visible={anuncio} onClose={() => setAnuncio(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lista: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', padding: 16, gap: 16, flexGrow: 1 },
  sessao: { alignSelf: 'center', fontSize: 12, color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, overflow: 'hidden' },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  bolha: { maxWidth: '85%', flexShrink: 1, padding: 14, borderRadius: radius.lg },
  bolhaIA: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 4 },
  bolhaUser: { backgroundColor: colors.text, borderTopRightRadius: 4 },
  rodape: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },
  inputBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, backgroundColor: colors.background, paddingLeft: 12, paddingRight: 6, paddingVertical: 6 },
  input: { flex: 1, fontSize: 16, color: colors.text, maxHeight: 140, minHeight: 36, paddingVertical: 8 },
  enviar: { width: TOUCH, height: TOUCH, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  aviso: { fontSize: 11, color: colors.textSubtle, textAlign: 'center', marginTop: 6 },
});
