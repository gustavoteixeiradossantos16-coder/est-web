import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { saveStudyPlan } from '@/lib/api';
import { DAYS, FREE_DAYS_PER_WEEK, type DayKey } from '@/lib/plan';
import { colors } from '@/lib/theme';

// No protótipo esta tela existia no HTML, mas nenhum código a exibia nem salvava os dados
export default function OnboardingScreen() {
  const { user, profile, logout } = useSession();
  const [goal, setGoal] = useState(profile?.goal ?? '');
  const [days, setDays] = useState<DayKey[]>(profile?.studyDays ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFree = profile?.plan !== 'pro';
  const maxDays = isFree ? FREE_DAYS_PER_WEEK : DAYS.length;

  function toggleDay(day: DayKey) {
    setError(null);
    if (days.includes(day)) setDays(days.filter((d) => d !== day));
    else if (days.length < maxDays) setDays([...days, day]);
    else setError(`No plano gratuito você escolhe até ${FREE_DAYS_PER_WEEK} dias por semana.`);
  }

  async function save() {
    if (!user) return;
    if (!goal.trim()) return setError('Conte qual é o seu foco de estudo.');
    if (days.length === 0) return setError('Escolha pelo menos um dia da semana.');
    setSaving(true);
    try {
      // Ao salvar, o perfil muda e o layout leva para o painel automaticamente
      await saveStudyPlan(user.uid, goal.trim(), days);
    } catch {
      setError('Não foi possível salvar. Verifique sua conexão.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Defina sua Rota de Aprovação</Text>
          <Text style={styles.subtitle}>
            Para a IA montar seu cronograma perfeito, precisamos de dois detalhes rápidos.
          </Text>

          <Text style={styles.label}>Qual é o seu foco?</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Concurso da Petrobras, Enfermagem..."
            placeholderTextColor={colors.textSubtle}
            value={goal}
            onChangeText={setGoal}
            maxLength={120}
          />

          <Text style={styles.label}>
            Dias disponíveis na semana{isFree ? ` (até ${FREE_DAYS_PER_WEEK} no plano gratuito)` : ''}:
          </Text>
          <View style={styles.days}>
            {DAYS.map(({ key, label }) => {
              const selected = days.includes(key);
              return (
                <Pressable
                  key={key}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggleDay(key)}
                  style={[styles.day, selected && styles.daySelected]}>
                  <Text style={[styles.dayText, selected && { color: colors.white }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Button title="Gerar Meu Plano com IA" onPress={save} loading={saving} style={{ marginTop: 8 }} />
          <Pressable onPress={logout}>
            <Text style={styles.logout}>Sair da conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: {
    paddingVertical: 10,
    width: 56,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  daySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  error: { color: colors.red, fontSize: 14 },
  logout: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 4 },
});
