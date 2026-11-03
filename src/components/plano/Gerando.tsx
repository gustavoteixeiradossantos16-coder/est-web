// Tela de espera enquanto a IA analisa as provas (até ~1 minuto).
// Sem progresso simulado por temporizador: o indicador gira até a resposta real da API chegar.
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Card, Icon, Muted } from '@/components/ui';
import { ANO_FIM, ANO_INI } from '@/lib/plan';
import { colors } from '@/lib/theme';

export function Gerando({ concurso }: { concurso: string }) {
  const etapas = [
    `Pesquisa das provas de ${concurso} (${ANO_INI}–${ANO_FIM})`,
    'Identificação das bancas e cargos',
    'Assuntos que mais caem',
    'Tipos de questão da banca',
    'Seu cronograma personalizado',
  ];

  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <View style={styles.circulo}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
      <Text style={styles.h2}>Analisando as provas…</Text>
      <Muted style={{ textAlign: 'center', marginBottom: 16 }}>
        Isso pode levar até 1 minuto. Você pode continuar nesta tela: o plano aparece assim que a IA terminar.
      </Muted>
      <Card style={{ gap: 12, width: '100%' }}>
        <Text style={styles.titulo}>O que a IA está montando para você</Text>
        {etapas.map((p) => (
          <View key={p} style={styles.passo}>
            <Icon name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={styles.passoText}>{p}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: 440, width: '100%', alignSelf: 'center', alignItems: 'center', paddingVertical: 24 },
  circulo: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  h2: { fontSize: 20, fontWeight: '800', color: colors.dark, marginBottom: 6 },
  titulo: { fontSize: 14, fontWeight: '700', color: colors.text },
  passo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passoText: { flex: 1, fontSize: 14, color: colors.textMuted },
});
