// Tutor IA (chat). Vindo de "Estudar com a IA" no plano, já envia o pedido da matéria sozinho.
// A tela fica montada dentro da sidebar: cada novo pedido chega por parâmetro (sem recarregar a tela).
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MensagemTexto } from '@/components/MensagemTexto';
import { useModals } from '@/components/Modals';
import { Button, Card, Icon, Muted, useGutter } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { api, ApiError } from '@/lib/api';
import type { Atividade, MensagemIA } from '@/lib/types';
import { colors, radius, TOUCH } from '@/lib/theme';

interface Msg {
  id: number;
  autor: 'user' | 'ia';
  texto: string;
}

const BOAS_VINDAS =
  'Olá! Sou o Tutor IA do StudyTimeIA e estou aqui para ajudar você a conquistar sua vaga.\nPor onde quer começar?\n\n1. Explicar um assunto do edital\n2. Praticar questões no estilo da banca\n3. Montar uma revisão rápida';

export default function Tutor() {
  const { perfil, setPerfil, recarregarPerfil } = useSession();
  const { abrirUpgrade, abrirAnuncio } = useModals();
  const params = useLocalSearchParams<{ materia?: string; assunto?: string; atividade?: string; minutos?: string; pedido?: string }>();
  const { width } = useWindowDimensions();
  const gutter = useGutter();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, autor: 'ia', texto: BOAS_VINDAS }]);
  const [historico, setHistorico] = useState<MensagemIA[]>([]);
  const [texto, setTexto] = useState('');
  const [digitando, setDigitando] = useState(false);
  const [respondido, setRespondido] = useState<string | null>(null);
  const [sessao, setSessao] = useState(0);
  const scroll = useRef<ScrollViewInstance>(null);
  const iniciado = useRef<string | null>(null);
  const proxId = useRef(1);

  const limite = !!perfil?.limitReached;
  const pro = perfil?.plan === 'pro';
  const materia = params.materia?.trim() ?? '';
  // Cada clique em "Estudar com a IA" manda um "pedido" novo: é ele que dispara o envio automático
  const pedido = params.pedido && materia ? params.pedido : null;
  const estudoPendente = !!pedido && pedido !== respondido && !limite;

  const adicionar = (autor: Msg['autor'], t: string) => setMsgs((m) => [...m, { id: proxId.current++, autor, texto: t }]);

  const tratarErro = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.codigo === 'LIMITE_DIARIO') recarregarPerfil();
      adicionar('ia', e instanceof Error ? `⚠️ ${e.message}` : '⚠️ Desculpe, ocorreu um erro de conexão. Tente novamente.');
    },
    [recarregarPerfil],
  );

  // Pedido vindo do plano: o servidor monta a pergunta com o concurso e já responde
  useEffect(() => {
    if (!perfil || !pedido || iniciado.current === pedido) return;
    iniciado.current = pedido;
    const atividade = (['teoria', 'questoes', 'revisao'] as const).includes(params.atividade as Atividade)
      ? (params.atividade as Atividade)
      : 'teoria';
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
    tarefa.finally(() => {
      setRespondido(pedido);
      // limpa a URL: recarregar a página não reenvia o pedido
      router.setParams({ materia: undefined, assunto: undefined, atividade: undefined, minutos: undefined, pedido: undefined });
    });
  }, [perfil, pedido, materia, params.assunto, params.atividade, params.minutos, tratarErro]);

  // Plano Free: conta 1 minuto de estudo por minuto com o Tutor aberto (é o limite do plano, não um atraso)
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

  async function enviar() {
    const t = texto.trim();
    if (!t || digitando || estudoPendente || limite) return;
    setTexto('');
    adicionar('user', t);
    setDigitando(true);
    try {
      const r = await api.chat(t, historico);
      adicionar('ia', r.resposta);
      setHistorico(r.historico);
    } catch (e) {
      tratarErro(e);
    } finally {
      setDigitando(false);
    }
  }

  const aguardando = estudoPendente ? `Preparando seu estudo de ${materia}…` : digitando ? 'Digitando…' : null;
  const estreito = width < 600;
  // Celular: balões quase na largura toda; computador: largura confortável de leitura
  const larguraBalao = estreito ? '88%' : '78%';
  const avatar = estreito ? 28 : 34;
  const estiloAvatar = { width: avatar, height: avatar, borderRadius: avatar / 2 };

  return (
    <SafeAreaView style={styles.tela} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          style={styles.tela}
          contentContainerStyle={[styles.lista, { paddingHorizontal: gutter }]}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {!pro && perfil && (
            <Text style={styles.sessao}>
              Sessão: {sessao} min · Hoje: {perfil.minutesToday}/{perfil.dailyLimit} min
            </Text>
          )}
          {msgs.map((m) => {
            const user = m.autor === 'user';
            return (
              <View key={m.id} style={[styles.linha, user && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.avatar, estiloAvatar, { backgroundColor: user ? colors.text : colors.primary }]}>
                  <Icon name={user ? 'person' : 'sparkles'} size={avatar / 2} color={colors.white} />
                </View>
                <View style={[styles.balao, { maxWidth: larguraBalao }, user ? styles.balaoUser : styles.balaoIA]}>
                  <MensagemTexto texto={m.texto} cor={user ? colors.white : colors.text} />
                </View>
              </View>
            );
          })}
          {aguardando && (
            <View style={styles.linha} accessibilityLiveRegion="polite">
              <View style={[styles.avatar, estiloAvatar, { backgroundColor: colors.primary }]}>
                <Icon name="sparkles" size={avatar / 2} color={colors.white} />
              </View>
              <View style={[styles.balao, styles.balaoIA, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>{aguardando}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.rodape, { paddingHorizontal: gutter }]}>
          {limite ? (
            <Card style={{ gap: 8, alignItems: 'center', padding: 14 }}>
              <Text style={styles.limiteTitulo}>Limite diário atingido</Text>
              <Muted style={{ textAlign: 'center' }}>
                Você usou seus {perfil?.dailyLimit} minutos de hoje no plano Free. Ganhe mais tempo com um anúncio ou faça upgrade.
              </Muted>
              <View style={styles.limiteBotoes}>
                <Button label="Ver Premium" small onPress={abrirUpgrade} style={{ flexGrow: 1 }} />
                {perfil && perfil.adsToday < perfil.adMaxPerDay && (
                  <Button
                    label={`+${perfil.adBonus} min com anúncio`}
                    icon="play-circle-outline"
                    variant="outline"
                    small
                    onPress={abrirAnuncio}
                    style={{ flexGrow: 1 }}
                  />
                )}
              </View>
            </Card>
          ) : (
            <>
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
                    const ev = e.nativeEvent as unknown as { key: string; shiftKey?: boolean };
                    if (Platform.OS === 'web' && ev.key === 'Enter' && !ev.shiftKey) {
                      (e as unknown as { preventDefault: () => void }).preventDefault();
                      enviar();
                    }
                  }}
                />
                <Pressable
                  onPress={enviar}
                  disabled={!texto.trim() || !!aguardando}
                  accessibilityRole="button"
                  accessibilityLabel="Enviar"
                  style={[styles.enviar, (!texto.trim() || !!aguardando) && { opacity: 0.4 }]}
                >
                  <Icon name="send" size={18} color={colors.white} />
                </Pressable>
              </View>
              <Text style={styles.aviso}>Respostas geradas por IA: confira sempre no material oficial do concurso.</Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.background },
  lista: { flexGrow: 1, paddingVertical: 12, gap: 10 },
  sessao: {
    alignSelf: 'center',
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  balao: { flexShrink: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.lg },
  balaoIA: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 4 },
  balaoUser: { backgroundColor: colors.text, borderTopRightRadius: 4 },
  rodape: { paddingTop: 8, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },
  limiteTitulo: { fontWeight: '800', fontSize: 16, color: colors.dark, textAlign: 'center' },
  limiteBotoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch' },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, maxHeight: 132, minHeight: 40, paddingVertical: 9 },
  enviar: { width: TOUCH, height: TOUCH, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  aviso: { fontSize: 11, color: colors.textSubtle, textAlign: 'center', marginTop: 4 },
});
