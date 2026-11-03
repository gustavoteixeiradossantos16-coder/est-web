// Assistente em 3 passos: concurso → dias → tempo. No fim, pede para a API gerar o plano.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { B, Button, Card, Dica, Icon, Muted, Title } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { CONCURSOS, DIAS, fmtMin, nomeConcurso, ordenarDias, TEMPOS_FREE, TEMPOS_PRO } from '@/lib/plan';
import { colors, radius, TOUCH } from '@/lib/theme';
import type { Perfil, Plano } from '@/lib/types';

export interface Escolhas {
  concursoId: string | null;
  outro: string;
  cargo: string;
  dias: string[];
  minutos: number;
}

export function escolhasIniciais(perfil: Perfil, plano: Plano | null): Escolhas {
  const pro = perfil.plan === 'pro';
  if (!plano) return { concursoId: null, outro: '', cargo: '', dias: [], minutos: perfil.freeMinutes };
  const conhecido = CONCURSOS.find((c) => c.id === plano.concursoId && c.id !== 'outro');
  return {
    concursoId: conhecido ? conhecido.id : 'outro',
    outro: conhecido ? '' : plano.concurso,
    cargo: plano.cargo,
    dias: pro ? [...plano.dias] : plano.dias.slice(0, perfil.freeMaxDays),
    minutos: pro ? plano.minutosDia : perfil.freeMinutes,
  };
}

export function Wizard({
  perfil,
  inicial,
  podeCancelar,
  onCancelar,
  onGerar,
  onUpgrade,
  onAnuncio,
}: {
  perfil: Perfil;
  inicial: Escolhas;
  podeCancelar: boolean;
  onCancelar: () => void;
  onGerar: (e: Escolhas) => void;
  onUpgrade: () => void;
  onAnuncio: () => void;
}) {
  const toast = useToast();
  const { width } = useWindowDimensions();
  const [passo, setPasso] = useState(1);
  const [sel, setSel] = useState<Escolhas>(inicial);
  const [busca, setBusca] = useState('');
  const pro = perfil.plan === 'pro';
  const maxDias = pro ? 7 : perfil.freeMaxDays;

  const valido =
    passo === 1
      ? !!sel.concursoId && (sel.concursoId !== 'outro' || sel.outro.trim().length >= 2)
      : passo === 2
        ? sel.dias.length > 0
        : sel.minutos > 0;

  function alternarDia(k: string) {
    if (sel.dias.includes(k)) return setSel({ ...sel, dias: sel.dias.filter((d) => d !== k) });
    if (sel.dias.length >= maxDias) {
      toast(`No plano Free são no máximo ${perfil.freeMaxDays} dias. Desmarque um dia ou faça upgrade.`);
      return;
    }
    setSel({ ...sel, dias: ordenarDias([...sel.dias, k]) });
  }

  const colunas = width >= 640 ? 3 : 2;
  const q = busca.trim().toLowerCase();
  const lista = CONCURSOS.filter((c) => c.id === 'outro' || !q || `${c.nome} ${c.area}`.toLowerCase().includes(q));

  return (
    <View style={{ paddingTop: 20 }}>
      <View style={styles.topo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1} role="heading">Monte seu plano de estudos</Text>
          <Muted style={{ marginTop: 4 }}>A IA analisa as provas dos últimos 15 anos e monta um cronograma sob medida para você.</Muted>
        </View>
        {podeCancelar && <Button label="Cancelar" icon="close" variant="ghost" small onPress={onCancelar} />}
      </View>

      {/* Como funciona */}
      <View style={styles.comoFunciona}>
        {[
          ['Você conta seu objetivo', 'Concurso, dias e tempo disponível.'],
          ['A IA analisa as provas', 'Descobre o que mais cai e monta o cronograma.'],
          ['Você estuda com 1 clique', 'Cada matéria abre o Tutor IA já no assunto certo.'],
        ].map(([t, d], i) => (
          <View key={t} style={styles.comoItem}>
            <Text style={styles.num}>{i + 1}</Text>
            <Text style={styles.comoText}>
              <B>{t}</B>
              {'\n'}
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Indicador de passos */}
      <View style={styles.stepper} accessibilityLabel={`Passo ${passo} de 3`}>
        {['Concurso', 'Dias', 'Tempo'].map((nome, i) => (
          <View key={nome} style={{ flex: 1 }}>
            <View style={[styles.stepBar, i < passo && { backgroundColor: colors.primary }]} />
            <Text style={[styles.stepText, i < passo && { color: colors.primary }]}>
              {i + 1}. {nome}
            </Text>
          </View>
        ))}
      </View>

      <Card style={{ gap: 14 }}>
        {passo === 1 && (
          <>
            <View>
              <Title>Para qual concurso você vai estudar?</Title>
              <Muted>Escolha um da lista ou digite outro.</Muted>
            </View>
            <View style={styles.buscaBox}>
              <Icon name="search" size={16} color={colors.textSubtle} />
              <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar concurso…" placeholderTextColor={colors.textSubtle} style={styles.buscaInput} accessibilityLabel="Buscar concurso" />
            </View>
            <View style={styles.grid}>
              {lista.map((c) => {
                const on = sel.concursoId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setSel({ ...sel, concursoId: c.id })}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    style={[styles.concurso, { width: `${100 / colunas - 2}%` }, on && styles.concursoOn]}
                  >
                    <View style={[styles.concursoIcon, on && { backgroundColor: colors.primary }]}>
                      <Icon name={c.icon} size={16} color={on ? colors.white : colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.concursoNome}>{c.nome}</Text>
                      <Text style={styles.concursoArea}>{c.area}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {sel.concursoId === 'outro' && (
              <Campo label="Nome do concurso" value={sel.outro} onChange={(outro) => setSel({ ...sel, outro })} placeholder="Ex.: Banco Central, Prefeitura de São Paulo…" />
            )}
            <Campo
              label="Cargo ou área (opcional, mas deixa a análise bem mais precisa)"
              value={sel.cargo}
              onChange={(cargo) => setSel({ ...sel, cargo })}
              placeholder="Ex.: Técnico de Enfermagem, Escriturário…"
            />
            <Dica titulo="Por que isso importa?">
              Cada concurso e cada banca cobram matérias e estilos de questão diferentes. Com o nome do concurso (e do cargo, se souber), a IA procura as provas certas para analisar.
            </Dica>
          </>
        )}

        {passo === 2 && (
          <>
            <View style={styles.linha}>
              <View style={{ flex: 1 }}>
                <Title>Quais dias da semana você vai estudar?</Title>
                <Muted>{pro ? 'Plano Premium: escolha quantos dias quiser.' : `Plano Free: escolha até ${perfil.freeMaxDays} dias por semana.`}</Muted>
              </View>
              <Text style={styles.contador}>
                {sel.dias.length}/{maxDias} dias
              </Text>
            </View>
            <View style={styles.dias}>
              {DIAS.map((d) => {
                const on = sel.dias.includes(d.k);
                return (
                  <Pressable
                    key={d.k}
                    onPress={() => alternarDia(d.k)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={d.full}
                    style={[styles.dia, on && styles.diaOn]}
                  >
                    <Text style={[styles.diaText, on && { color: colors.white }]}>{d.l}</Text>
                  </Pressable>
                );
              })}
            </View>
            {!pro && sel.dias.length >= perfil.freeMaxDays && (
              <Pressable onPress={onUpgrade} style={styles.upsell} accessibilityRole="button">
                <Icon name="flash" size={18} color={colors.primary} />
                <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>Quer estudar todos os dias? O Premium libera os 7 dias da semana.</Text>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Ver Premium</Text>
              </Pressable>
            )}
            <Dica titulo="Dica:">
              constância vale mais que quantidade. Escolha os dias em que você realmente consegue estudar — a IA distribui as matérias entre eles e alterna os assuntos para você não esquecer o que já viu.
            </Dica>
          </>
        )}

        {passo === 3 && (
          <>
            <View>
              <Title>Quanto tempo por dia?</Title>
              <Muted>
                {pro
                  ? 'Plano Premium: tempo ilimitado. Escolha quanto quiser.'
                  : `Plano Free: ${perfil.freeMinutes} min por dia.${perfil.bonusToday ? ` Hoje você tem +${perfil.bonusToday} min de bônus.` : ''} Para mais tempo, assista a anúncios ou faça upgrade.`}
              </Muted>
            </View>
            <View style={styles.tempos}>
              {(pro ? TEMPOS_PRO : TEMPOS_FREE).map((m) => {
                const bloqueado = !pro && m !== perfil.freeMinutes;
                const on = sel.minutos === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => (bloqueado ? onUpgrade() : setSel({ ...sel, minutos: m }))}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on, disabled: bloqueado }}
                    accessibilityLabel={bloqueado ? `${fmtMin(m)}, só no Premium` : fmtMin(m)}
                    style={[styles.tempo, on && styles.diaOn, bloqueado && { backgroundColor: colors.background }]}
                  >
                    {bloqueado && <Icon name="lock-closed" size={13} color={colors.textSubtle} />}
                    <Text style={[styles.diaText, on && { color: colors.white }, bloqueado && { color: colors.textSubtle }]}>{fmtMin(m)}</Text>
                  </Pressable>
                );
              })}
            </View>

            {!pro && (
              <View style={styles.anuncio}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Icon name="gift-outline" size={22} color={colors.amberText} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.text, fontSize: 14 }}>Quer estudar mais hoje?</Text>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>
                      Assista a um anúncio curto e ganhe +{perfil.adBonus} min de estudo hoje ({perfil.adsToday}/{perfil.adMaxPerDay} hoje).
                    </Text>
                  </View>
                </View>
                <Button label="Assistir anúncio" icon="play-circle-outline" variant="amber" small onPress={onAnuncio} />
              </View>
            )}

            <Dica titulo="Como o tempo é usado:">
              a IA divide seu tempo diário em blocos de <B>Teoria</B> (aprender o conteúdo), <B>Questões</B> (treinar no estilo da banca) e <B>Revisão</B> (fixar o que já estudou).
            </Dica>

            <View style={styles.resumo}>
              <Text style={{ fontWeight: '700', color: colors.text }}>Resumo</Text>
              <Text style={styles.resumoText}>
                <B>{nomeConcurso(sel.concursoId, sel.outro)}</B>
                {sel.cargo.trim() ? ` · ${sel.cargo.trim()}` : ''}
              </Text>
              <Text style={styles.resumoText}>
                {sel.dias.map((k) => DIAS.find((d) => d.k === k)?.l).join(', ')} · {fmtMin(sel.minutos)}/dia · <B>{fmtMin(sel.minutos * sel.dias.length)}</B> por semana
              </Text>
            </View>
            <Muted style={{ fontSize: 13 }}>
              Ao tocar em <B>Gerar meu plano com IA</B>, a análise leva até 1 minuto. Depois, é só tocar em <B>Estudar com a IA</B> em qualquer matéria: o Tutor abre direto no assunto, sem você precisar digitar nada.
            </Muted>
          </>
        )}

        <View style={styles.nav}>
          <Button label="Voltar" icon="arrow-back" variant="ghost" small onPress={() => setPasso(passo - 1)} style={passo === 1 && { opacity: 0 }} disabled={passo === 1} />
          <Button
            label={passo < 3 ? 'Continuar' : 'Gerar meu plano com IA'}
            icon={passo < 3 ? 'arrow-forward' : 'sparkles'}
            disabled={!valido}
            onPress={() => (passo < 3 ? setPasso(passo + 1) : onGerar(sel))}
            style={{ flexShrink: 1 }}
          />
        </View>
      </Card>
    </View>
  );
}

function Campo({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textSubtle} maxLength={80} style={styles.input} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  h1: { fontSize: 26, fontWeight: '800', color: colors.dark },
  comoFunciona: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  comoItem: { flexGrow: 1, flexBasis: 220, flexDirection: 'row', gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12 },
  num: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.primarySoft, color: colors.primary, fontWeight: '800', fontSize: 12, textAlign: 'center', lineHeight: 24 },
  comoText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  stepper: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  stepBar: { height: 6, borderRadius: radius.full, backgroundColor: colors.border, marginBottom: 6 },
  stepText: { fontSize: 12, fontWeight: '700', color: colors.textSubtle },
  buscaBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, paddingHorizontal: 12, minHeight: 46 },
  buscaInput: { flex: 1, fontSize: 16, color: colors.text, minHeight: 44 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  concurso: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.white, minHeight: 60 },
  concursoOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  concursoIcon: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  concursoNome: { fontSize: 14, fontWeight: '700', color: colors.dark },
  concursoArea: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, paddingHorizontal: 14, fontSize: 16, color: colors.text },
  linha: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  contador: { fontSize: 12, fontWeight: '700', color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, overflow: 'hidden' },
  dias: { flexDirection: 'row', gap: 6 },
  dia: { flex: 1, minHeight: 52, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  diaOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  diaText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  upsell: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder, minHeight: TOUCH },
  tempos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tempo: { flexGrow: 1, flexBasis: '22%', minWidth: 72, minHeight: 50, flexDirection: 'row', gap: 4, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  anuncio: { gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.amberBorder, backgroundColor: colors.amberSoft },
  resumo: { gap: 4, padding: 14, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  resumoText: { fontSize: 14, color: colors.textMuted },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.surface, paddingTop: 16, marginTop: 4 },
});
