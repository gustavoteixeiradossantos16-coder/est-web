// Texto das mensagens do chat: 14 px e quebras de linha (\n) exibidas como vieram da IA.
// O back-end já devolve texto puro (sem Markdown); aqui só normalizamos as quebras.
import { StyleSheet, Text } from 'react-native';

import { colors } from '@/lib/theme';

export function normalizarQuebras(texto: string) {
  return (texto ?? '')
    .replace(/\r\n?/g, '\n') // \r\n (Windows) e \r viram \n
    .replace(/\n{3,}/g, '\n\n') // no máximo uma linha em branco seguida
    .trim();
}

export function MensagemTexto({ texto, cor = colors.text }: { texto: string; cor?: string }) {
  // <Text> do React Native exibe "\n" como quebra de linha no Android, iOS e na web
  return (
    <Text selectable style={[styles.texto, { color: cor }]}>
      {normalizarQuebras(texto)}
    </Text>
  );
}

const styles = StyleSheet.create({
  texto: { fontSize: 14, lineHeight: 21 },
});
