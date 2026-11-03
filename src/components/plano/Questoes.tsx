// Aba Questões: no Premium a IA busca questões de provas anteriores, com correção
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { B, Button, Card, Icon, Muted, ProgressBar, Tag } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { colors, radius } from '@/lib/theme';
import type { Perfil, Plano, Questao } from '@/lib/types';

import { estudarComIA } from './PlanoView';

interface Quiz {
  questoes: Questao[];
  i: number;
  acertos: number;
  resposta: string | null;
  materia: string;
}

export function Questoes({ plano, perfil, onUpgrade }: { plano: Plano; perfil: Perfil; onUpgrade: () => void }) {
  const toast = useToast();
  const materias = plano.dados.materias;
  const [mi, setMi] = useState(0);
  const [assunto, setAssunto] = useState('');
  const [qtd, setQtd] = useState(5);
  const [buscando, setBuscando] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  if (perfil.plan !== 'pro') {
    return (
      <Card style={{ alignItems: 'center', gap: 12, padding: 28 }}>
        <View style={styles.cadeado}>
          <Icon name="lock-closed" size={28} color={colors.primary} />
        </View>
        <Text style={styles.h3}>Treine com questões de provas anteriores</Text>
        <Muted style={{ textAlign: 'center' }}>
          No Premium, a IA busca questões das provas anteriores de <B>{plano.concurso}</B> sobre as matérias do seu plano, com correção e explicação de cada alternativa.
        </Muted>
        <Button label="Desbloquear com Premium" icon="flash" onPress={onUpgrade} style={{ alignSelf: 'stretch', marginTop: 8 }} />
      </Card>
    );
  }

  async function buscar() {
    const m = materias[mi];
    if (!m) return;
    setBuscando(true);
    try {
      const r = await api.questoes(m.nome, assunto, qtd);
      setQuiz({ questoes: r.questoes, i: 0, acertos: 0, resposta: null, materia: m.nome });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não foi possível buscar as questões.', 'error');
    } finally {
      setBuscando(false);
    }
  }

  if (quiz && quiz.i >= quiz.questoes.length) {
    const pct = Math.round((quiz.acertos / quiz.questoes.length) * 100);
    const cor = pct >= 70 ? colors.greenText : pct >= 50 ? colors.amberText : colors.redText;
    return (
      <Card style={{ alignItems: 'center', gap: 10, padding: 28 }}>
        <Text style={[styles.placar, { color: cor }]}>{pct}%</Text>
        <Text style={styles.h3}>
          {quiz.acertos} de {quiz.questoes.length} acertos
        </Text>
        <Muted style={{ textAlign: 'center' }}>
          {pct >= 70 ? 'Mandou bem! Continue assim.' : pct >= 50 ? 'Bom caminho. Revise os pontos que errou.' : 'Vale reforçar a teoria dessa matéria antes de praticar de novo.'}
        </Muted>
        <Button label="Novas questões" onPress={() => setQuiz(null)} style={{ alignSelf: 'stretch', marginTop: 8 }} />
        <Button label={`Revisar ${quiz.materia} no Tutor`} variant="outline" onPress={() => estudarComIA({ materia: quiz.materia, atividade: 'revisao' })} style={{ alignSelf: 'stretch' }} />
      </Card>
    );
  }

  if (quiz) {
    const q = quiz.questoes[quiz.i];
    const respondeu = quiz.resposta !== null;
    const acertou = quiz.resposta === q.correta;
    const real = q.origem !== 'inedita';
    return (
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button label={quiz.materia} icon="arrow-back" variant="ghost" small onPress={() => setQuiz(null)} style={{ flexShrink: 1 }} />
          <Text style={{ fontWeight: '600', color: colors.textMuted }}>
            Questão {quiz.i + 1} de {quiz.questoes.length}
          </Text>
        </View>
        <ProgressBar pct={(quiz.i / quiz.questoes.length) * 100} height={6} track={colors.border} />
        <Card style={{ gap: 12 }}>
          <Tag
            label={q.fonte || (real ? 'Prova anterior' : 'Inédita no estilo da banca')}
            icon={real ? 'document-text-outline' : 'sparkles'}
            bg={real ? colors.emeraldSoft : colors.surface}
            fg={real ? colors.emeraldText : colors.textMuted}
          />
          <Text style={{ fontSize: 15, lineHeight: 23, color: colors.text }}>{q.enunciado}</Text>
          {q.alternativas.map((a) => {
            const certa = a.letra === q.correta;
            const marcada = a.letra === quiz.resposta;
            const estilo = respondeu ? (certa ? styles.altCerta : marcada ? styles.altErrada : { opacity: 0.6 }) : null;
            return (
              <Pressable
                key={a.letra}
                disabled={respondeu}
                onPress={() => setQuiz({ ...quiz, resposta: a.letra, acertos: quiz.acertos + (a.letra === q.correta ? 1 : 0) })}
                accessibilityRole="button"
                accessibilityLabel={`Alternativa ${a.letra}: ${a.texto}`}
                style={[styles.alt, estilo]}
              >
                <Text style={[styles.letra, respondeu && certa && styles.letraCerta, respondeu && marcada && !certa && styles.letraErrada]}>{a.letra}</Text>
                <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.text }}>{a.texto}</Text>
              </Pressable>
            );
          })}
          {respondeu && (
            <>
              <View style={[styles.feedback, acertou ? styles.altCerta : styles.altErrada]}>
                <Text style={{ fontWeight: '700', color: acertou ? colors.greenText : colors.redText }}>
                  {acertou ? 'Resposta correta!' : `Resposta incorreta. Gabarito: ${q.correta}`}
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 20, color: colors.text }}>{q.explicacao}</Text>
              </View>
              <Button
                label={quiz.i + 1 < quiz.questoes.length ? 'Próxima questão' : 'Ver resultado'}
                icon="arrow-forward"
                variant="dark"
                onPress={() => setQuiz({ ...quiz, i: quiz.i + 1, resposta: null })}
              />
            </>
          )}
        </Card>
      </View>
    );
  }

  const m = materias[mi];
  return (
    <Card style={{ gap: 14 }}>
      <View>
        <Text style={styles.h3}>Praticar questões</Text>
        <Muted>A IA busca questões de provas anteriores de {plano.concurso} para você resolver.</Muted>
      </View>
      <Escolha titulo="Matéria" opcoes={materias.map((x, i) => ({ v: String(i), l: x.nome }))} valor={String(mi)} onChange={(v) => { setMi(Number(v)); setAssunto(''); }} />
      <Escolha titulo="Assunto" opcoes={[{ v: '', l: 'Todos os assuntos' }, ...(m?.assuntos ?? []).map((a) => ({ v: a.nome, l: a.nome }))]} valor={assunto} onChange={setAssunto} />
      <Escolha titulo="Quantidade" opcoes={[{ v: '5', l: '5 questões' }, { v: '10', l: '10 questões' }]} valor={String(qtd)} onChange={(v) => setQtd(Number(v))} />
      <Button label={buscando ? 'Buscando questões…' : 'Buscar questões'} icon="sparkles" loading={buscando} onPress={buscar} />
    </Card>
  );
}

/** Lista de opções em "chips" (funciona igual no celular e no navegador). */
function Escolha({ titulo, opcoes, valor, onChange }: { titulo: string; opcoes: { v: string; l: string }[]; valor: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{titulo}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} role="radiogroup">
        {opcoes.map((o) => {
          const on = o.v === valor;
          return (
            <Pressable key={o.v} onPress={() => onChange(o.v)} role="radio" aria-checked={on} style={[styles.chip, on && styles.chipOn]}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: on ? colors.white : colors.textMuted }}>{o.l}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cadeado: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  h3: { fontSize: 18, fontWeight: '700', color: colors.dark, textAlign: 'center' },
  placar: { fontSize: 36, fontWeight: '800' },
  alt: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, minHeight: 48 },
  altCerta: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  altErrada: { borderColor: '#f87171', backgroundColor: colors.redSoft },
  letra: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surface, textAlign: 'center', lineHeight: 28, fontWeight: '700', fontSize: 12, color: colors.textMuted },
  letraCerta: { backgroundColor: colors.green, color: colors.white },
  letraErrada: { backgroundColor: '#f87171', color: colors.white },
  feedback: { gap: 6, padding: 14, borderRadius: radius.md, borderWidth: 1 },
  chip: { minHeight: 40, paddingHorizontal: 12, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderStrong, justifyContent: 'center', backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
