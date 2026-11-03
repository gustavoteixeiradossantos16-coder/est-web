// Tela de espera enquanto a IA analisa as provas (até ~1 minuto)
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Card, Icon, Muted } from '@/components/ui';
import { ANO_FIM, ANO_INI } from '@/lib/plan';
import { colors } from '@/lib/theme';

export function Gerando({ concurso }: { concurso: string }) {
  const [i, setI] = useState(0);
  const passos = [
    `Buscando provas de ${concurso} (${ANO_INI}–${ANO_FIM})`,
    'Identificando bancas e cargos',
    'Mapeando os assuntos que mais caem',
    'Analisando os tipos de questão',
    'Montando seu cronograma personalizado',
  ];
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, passos.length - 1)), 7000);
    return () => clearInterval(t);
  }, [passos.length]);

  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <View style={styles.circulo}>
        <Icon name="sparkles" size={36} color={colors.white} />
      </View>
      <Text style={styles.h2}>Analisando as provas…</Text>
      <Muted style={{ textAlign: 'center', marginBottom: 20 }}>
        Isso pode levar até 1 minuto. A IA está pesquisando provas anteriores e cruzando os dados com suas escolhas.
      </Muted>
      <Card style={{ gap: 14, width: '100%' }}>
        {passos.map((p, j) => (
          <View key={p} style={styles.passo}>
            {j < i ? (
              <Icon name="checkmark-circle" size={20} color={colors.green} />
            ) : j === i ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Icon name="ellipse-outline" size={20} color={colors.textSubtle} />
            )}
            <Text style={[styles.passoText, j > i && { color: colors.textSubtle }, j === i && { fontWeight: '700' }]}>{p}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: 440, width: '100%', alignSelf: 'center', alignItems: 'center', paddingVertical: 40 },
  circulo: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  h2: { fontSize: 20, fontWeight: '800', color: colors.dark, marginBottom: 8 },
  passo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  passoText: { flex: 1, fontSize: 14, color: colors.text },
});
