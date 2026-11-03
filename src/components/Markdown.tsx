// Mostra as respostas da IA com negrito, títulos e listas (Markdown simples)
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

function Inline({ texto, cor }: { texto: string; cor: string }) {
  // **negrito** e *itálico*
  const partes = texto.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).filter(Boolean);
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <Text key={i} style={{ fontWeight: '700', color: cor }}>{p.slice(2, -2)}</Text>
        ) : p.startsWith('*') && p.endsWith('*') && p.length > 2 ? (
          <Text key={i} style={{ fontStyle: 'italic', color: cor }}>{p.slice(1, -1)}</Text>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

export function Markdown({ texto, cor = colors.text }: { texto: string; cor?: string }) {
  const linhas = texto.replace(/\r/g, '').split('\n');
  return (
    <View style={{ gap: 6 }}>
      {linhas.map((linha, i) => {
        const l = linha.trimEnd();
        if (!l.trim()) return <View key={i} style={{ height: 2 }} />;
        const titulo = l.match(/^#{1,6}\s+(.*)$/);
        if (titulo)
          return (
            <Text key={i} style={[styles.base, { color: cor, fontWeight: '800', fontSize: 15, marginTop: 4 }]}>
              <Inline texto={titulo[1]} cor={cor} />
            </Text>
          );
        const item = l.match(/^(\s*)([-*•]|\d+[.)])\s+(.*)$/);
        if (item)
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 6, paddingLeft: Math.min(item[1].length, 6) * 4 }}>
              <Text style={[styles.base, { color: cor }]}>{/\d/.test(item[2]) ? item[2] : '•'}</Text>
              <Text style={[styles.base, { color: cor, flex: 1 }]}>
                <Inline texto={item[3]} cor={cor} />
              </Text>
            </View>
          );
        if (/^-{3,}$/.test(l.trim())) return <View key={i} style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />;
        return (
          <Text key={i} style={[styles.base, { color: cor }]}>
            <Inline texto={l} cor={cor} />
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ base: { fontSize: 14, lineHeight: 21 } });
