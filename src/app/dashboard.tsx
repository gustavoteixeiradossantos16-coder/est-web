import { Ionicons } from '@expo/vector-icons';
import { FirebaseError } from 'firebase/app';
import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UpgradeModal } from '@/components/UpgradeModal';
import { Button, Logo } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { askTutor, trackStudyMinute, type ChatMessage } from '@/lib/api';
import { blockReason, FREE_MINUTES_PER_DAY, minutesUsedToday } from '@/lib/plan';
import { colors } from '@/lib/theme';

// Mensagens enviadas como contexto para a IA (o histórico do protótipo crescia sem limite)
const HISTORY_LIMIT = 20;

interface UiMessage extends ChatMessage {
  id: string;
}

const GREETING: UiMessage = {
  id: 'greeting',
  role: 'model',
  text: 'Olá! Sou o tutor IA do StudyTimeIA. Estou aqui para ajudar você a conquistar sua vaga. Que matéria de edital vamos estudar hoje?',
};

function tutorErrorMessage(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : '';
  if (code === 'functions/resource-exhausted') return 'Seu tempo de estudo de hoje acabou.';
  if (code === 'functions/unauthenticated') return 'Sua sessão expirou. Entre novamente.';
  return 'Desculpe, ocorreu um erro de conexão. Tente novamente.';
}

export default function DashboardScreen() {
  const { profile, logout } = useSession();
  const [messages, setMessages] = useState<UiMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const listRef = useRef<FlatList<UiMessage>>(null);

  const isPro = profile?.plan === 'pro';
  const blocked = profile ? blockReason(profile) : null;
  const minutes = profile ? minutesUsedToday(profile) : 0;
  const progress = Math.min(minutes / FREE_MINUTES_PER_DAY, 1);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));
    return () => sub.remove();
  }, []);

  // Cronômetro: só conta com o app aberto e sem bloqueio. A cada minuto o servidor registra o uso;
  // no protótipo o próprio navegador gravava minutesToday e podia zerar o contador.
  useEffect(() => {
    if (!appActive || blocked) return;
    let seconds = 0;
    const interval = setInterval(() => {
      seconds += 1;
      setSessionSeconds((s) => s + 1);
      if (seconds % 60 === 0) trackStudyMinute().catch(() => undefined);
    }, 1000);
    return () => clearInterval(interval);
  }, [appActive, blocked]);

  async function send() {
    const text = input.trim();
    if (!text || waiting || blocked) return;

    const userMessage: UiMessage = { id: `u-${Date.now()}`, role: 'user', text };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput('');
    setWaiting(true);

    try {
      // A saudação é local e não vai para a IA (o Gemini exige que a conversa comece pelo usuário)
      const history = next
        .filter((m) => m.id !== GREETING.id)
        .slice(-HISTORY_LIMIT)
        .map(({ role, text: t }) => ({ role, text: t }));
      const answer = await askTutor(history);
      setMessages((current) => [...current, { id: `m-${Date.now()}`, role: 'model', text: answer }]);
    } catch (e) {
      setMessages((current) => [...current, { id: `e-${Date.now()}`, role: 'model', text: tutorErrorMessage(e) }]);
    } finally {
      setWaiting(false);
    }
  }

  const mm = Math.floor(sessionSeconds / 60).toString().padStart(2, '0');
  const ss = (sessionSeconds % 60).toString().padStart(2, '0');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Logo size={18} />
        <View style={styles.headerRight}>
          <View style={styles.timer}>
            <Ionicons name="timer-outline" size={16} color={colors.textMuted} />
            <Text style={styles.timerText}>
              {mm}:{ss}
            </Text>
          </View>
          <Pressable onPress={logout} hitSlop={10} accessibilityLabel="Sair da conta">
            <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.planBar}>
        <View style={[styles.badge, isPro && { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, isPro && { color: colors.white }]}>{isPro ? 'PRO' : 'FREE'}</Text>
        </View>
        {isPro ? (
          <Text style={styles.unlimited}>Acesso ilimitado ativo</Text>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <Text style={styles.planText}>
                Tempo hoje: {minutes} / {FREE_MINUTES_PER_DAY} min
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${progress * 100}%`, backgroundColor: progress > 0.8 ? colors.red : colors.orange },
                  ]}
                />
              </View>
            </View>
            <Pressable onPress={() => setUpgradeOpen(true)} style={styles.upgrade}>
              <Ionicons name="flash" size={14} color={colors.yellow} />
              <Text style={styles.upgradeText}>Upgrade</Text>
            </Pressable>
          </>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.chat}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <Bubble message={item} />}
          ListFooterComponent={waiting ? <Text style={styles.typing}>O tutor está digitando…</Text> : undefined}
        />

        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua dúvida de concurso aqui..."
              placeholderTextColor={colors.textSubtle}
              value={input}
              onChangeText={setInput}
              editable={!blocked}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={send}
              disabled={!input.trim() || waiting || !!blocked}
              style={({ pressed }) => [
                styles.send,
                pressed && { backgroundColor: colors.primaryDark },
                (!input.trim() || waiting || !!blocked) && { opacity: 0.5 },
              ]}
              accessibilityLabel="Enviar">
              <Ionicons name="send" size={18} color={colors.white} />
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>
            As respostas são geradas por IA e devem ser verificadas no material oficial do concurso.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {blocked && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <View style={styles.overlayIcon}>
              <Ionicons
                name={blocked === 'daily-limit' ? 'time-outline' : 'calendar-outline'}
                size={32}
                color={colors.orange}
              />
            </View>
            <Text style={styles.overlayTitle}>
              {blocked === 'daily-limit' ? 'Limite Diário Atingido' : 'Hoje não é dia de estudo'}
            </Text>
            <Text style={styles.overlayText}>
              {blocked === 'daily-limit'
                ? `Você utilizou seus ${FREE_MINUTES_PER_DAY} minutos de estudo gratuitos de hoje. Continue focando na sua aprovação sem limites!`
                : 'No plano gratuito você estuda nos dias escolhidos na sua rota. Com o Premium, estude todos os dias.'}
            </Text>
            <Button title="Desbloquear Acesso Ilimitado" variant="dark" onPress={() => setUpgradeOpen(true)} />
            <Pressable onPress={logout}>
              <Text style={styles.overlayLogout}>Sair da conta</Text>
            </Pressable>
          </View>
        </View>
      )}

      <UpgradeModal visible={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </SafeAreaView>
  );
}

// Texto puro: o protótipo injetava a resposta da IA com innerHTML (risco de XSS)
function Bubble({ message }: { message: UiMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser && { flexDirection: 'row-reverse' }]}>
      <View style={[styles.avatar, { backgroundColor: isUser ? colors.text : colors.primary }]}>
        <Ionicons name={isUser ? 'person' : 'sparkles'} size={18} color={colors.white} />
      </View>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
        <Text selectable style={[styles.bubbleText, isUser && { color: colors.white }]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timerText: { fontSize: 14, fontWeight: '500', color: colors.textMuted, fontVariant: ['tabular-nums'] },
  planBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  badge: { backgroundColor: colors.orangeSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.orangeText, letterSpacing: 0.5 },
  unlimited: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  planText: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  track: { height: 6, backgroundColor: colors.border, borderRadius: 999, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 999 },
  upgrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.dark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  chat: { padding: 16, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bubble: { padding: 14, borderRadius: 16, maxWidth: '82%' },
  bubbleUser: { backgroundColor: colors.text, borderTopRightRadius: 4 },
  bubbleAi: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22, color: colors.text },
  typing: { color: colors.textSubtle, fontSize: 13, marginLeft: 46 },
  inputArea: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
    gap: 6,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  send: { backgroundColor: colors.primary, borderRadius: 10, padding: 12 },
  disclaimer: { fontSize: 10, color: colors.textSubtle, textAlign: 'center' },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.88)',
    justifyContent: 'center',
    padding: 16,
  },
  overlayCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'stretch',
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  overlayIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  overlayTitle: { fontSize: 20, fontWeight: '700', color: colors.dark, textAlign: 'center' },
  overlayText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  overlayLogout: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
