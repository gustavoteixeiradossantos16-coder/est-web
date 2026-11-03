// Plano gerado: resumo, abas (Cronograma, Análise, Questões) e botões "Estudar com a IA"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { B, Button, Card, Icon, Muted, ProgressBar, Tag } from '@/components/ui';
import { ANO_FIM, ANO_INI, ATIVIDADES, chaveBloco, diaInfo, fmtMin, hojeKey, INCIDENCIA, progressoSemana, type IconName } from '@/lib/plan';
import { colors, radius, TOUCH } from '@/lib/theme';
import type { Atividade, Perfil, Plano } from '@/lib/types';

import { Questoes } from './Questoes';

type Aba = 'cronograma' | 'analise' | 'questoes';
const GUIA_KEY = 'studytime-guia-plano-fechado';

/** Abre o Tutor já estudando a matéria (o Tutor envia o pedido sozinho). */
export function estudarComIA(p: { materia: string; assunto?: string; atividade?: Atividade; minutos?: number }) {
  router.push({
    pathname: '/tutor',
    params: {
      materia: p.materia,
      ...(p.assunto ? { assunto: p.assunto } : {}),
      ...(p.atividade ? { atividade: p.atividade } : {}),
      ...(p.minutos ? { minutos: String(Math.round(p.minutos)) } : {}),
    },
  });
}

export function PlanoView({
  plano,
  perfil,
  onEditar,
  onMarcar,
  onUpgrade,
  onAnuncio,
}: {
  plano: Plano;
  perfil: Perfil;
  onEditar: () => void;
  onMarcar: (chave: string, feito: boolean) => void;
  onUpgrade: () => void;
  onAnuncio: () => void;
}) {
  const [aba, setAba] = useState<Aba>('cronograma');
  const pr = progressoSemana(plano);
  const d = plano.dados;
  const cargo = d.cargoConsiderado || plano.cargo;

  return (
    <View style={{ paddingTop: 16 }}>
      {/* Resumo */}
      <View style={styles.hero}>
        <Text style={styles.kicker}>SEU PLANO DE ESTUDOS</Text>
        <Text style={styles.heroTitle} role="heading">{plano.concurso}</Text>
        <Text style={styles.heroSub}>
          {cargo ? `${cargo} · ` : ''}Banca: {d.bancas.length ? d.bancas.join(', ') : 'não identificada'}
        </Text>
        <View style={styles.heroBtns}>
          <Button label="Editar" icon="pencil" small onPress={onEditar} style={styles.heroBtnClaro} />
          <Button label="Tutor IA" icon="chatbubble-ellipses-outline" small onPress={() => router.push('/tutor')} />
        </View>
        <View style={styles.stats}>
          <Stat icon="calendar-outline" big={`${plano.dias.length} dias`} small="por semana" />
          <Stat icon="time-outline" big={fmtMin(plano.minutosDia)} small="por dia" />
          <Stat icon="timer-outline" big={fmtMin(plano.minutosDia * plano.dias.length)} small="por semana" />
          <Stat icon="document-text-outline" big={`${d.provasAnalisadas.length} ${d.provasAnalisadas.length === 1 ? 'prova' : 'provas'}`} small={`analisadas (${d.periodo || `${ANO_INI}-${ANO_FIM}`})`} />
        </View>
        <View style={styles.progHead}>
          <Text style={styles.progText}>Progresso da semana</Text>
          <Text style={styles.progText}>
            {pr.feitos}/{pr.total} blocos · {pr.pct}%
          </Text>
        </View>
        <ProgressBar pct={pr.pct} color="#34d399" track="#ffffff1a" />
      </View>

      {/* Abas */}
      <View style={styles.abas} role="tablist">
        {(
          [
            ['cronograma', 'Cronograma'],
            ['analise', 'Análise'],
            ['questoes', 'Questões'],
          ] as const
        ).map(([k, label]) => (
          <Pressable key={k} onPress={() => setAba(k)} role="tab" aria-selected={aba === k} style={[styles.aba, aba === k && styles.abaOn]}>
            <Text style={[styles.abaText, aba === k && { color: colors.primary }]}>{label}</Text>
            {k === 'questoes' && <Text style={styles.pro}>PRO</Text>}
          </Pressable>
        ))}
      </View>

      {aba === 'cronograma' && <Cronograma plano={plano} perfil={perfil} onMarcar={onMarcar} onAnuncio={onAnuncio} />}
      {aba === 'analise' && <Analise plano={plano} />}
      {aba === 'questoes' && <Questoes plano={plano} perfil={perfil} onUpgrade={onUpgrade} />}
    </View>
  );
}

function Stat({ icon, big, small }: { icon: IconName; big: string; small: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={16} color="#a5b4fc" />
      <Text style={styles.statBig}>{big}</Text>
      <Text style={styles.statSmall}>{small}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- Cronograma
function Cronograma({ plano, perfil, onMarcar, onAnuncio }: { plano: Plano; perfil: Perfil; onMarcar: (c: string, f: boolean) => void; onAnuncio: () => void }) {
  const crono = plano.dados.cronograma;
  const itens = plano.progresso?.itens ?? {};
  const [dia, setDia] = useState(() => (crono.some((c) => c.dia === hojeKey()) ? hojeKey() : crono[0]?.dia));
  const [guiaFechado, setGuiaFechado] = useState(true);
  const atual = crono.find((c) => c.dia === dia) ?? { dia: '', foco: '', blocos: [] };
  const pro = perfil.plan === 'pro';

  useEffect(() => {
    AsyncStorage.getItem(GUIA_KEY)
      .then((v) => setGuiaFechado(v === '1'))
      .catch(() => setGuiaFechado(false));
  }, []);
  function guia(fechar: boolean) {
    setGuiaFechado(fechar);
    (fechar ? AsyncStorage.setItem(GUIA_KEY, '1') : AsyncStorage.removeItem(GUIA_KEY)).catch(() => {});
  }

  return (
    <View style={{ gap: 12 }}>
      {guiaFechado ? (
        <Pressable onPress={() => guia(false)} accessibilityRole="button" style={styles.abrirGuia}>
          <Icon name="help-circle-outline" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Como usar meu plano?</Text>
        </Pressable>
      ) : (
        <Card style={{ gap: 12, borderColor: colors.primaryBorder }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="compass-outline" size={20} color={colors.primary} />
            <Text style={{ flex: 1, fontWeight: '700', color: colors.dark, fontSize: 16 }}>Como usar seu plano</Text>
            <Pressable onPress={() => guia(true)} accessibilityRole="button" accessibilityLabel="Fechar guia" style={styles.fechar}>
              <Icon name="close" size={18} color={colors.textSubtle} />
            </Pressable>
          </View>
          {[
            ['Escolha o dia.', 'O dia de hoje já vem selecionado (marcado com •).'],
            ['Toque em “Estudar com a IA”.', 'O Tutor abre já explicando a matéria — sem precisar digitar.'],
            ['Marque como concluído.', 'Volte aqui e marque a caixinha para acompanhar seu progresso.'],
          ].map(([t, dsc], i) => (
            <View key={t} style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={styles.numCheio}>{i + 1}</Text>
              <Text style={{ flex: 1, fontSize: 14, color: colors.textMuted, lineHeight: 20 }}>
                <B>{t}</B> {dsc}
              </Text>
            </View>
          ))}
          <View style={styles.legenda}>
            {(Object.keys(ATIVIDADES) as Atividade[]).map((k) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Tag label={ATIVIDADES[k].label} icon={ATIVIDADES[k].icon} bg={ATIVIDADES[k].bg} fg={ATIVIDADES[k].fg} />
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{ATIVIDADES[k].explica}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {crono.map((c) => {
          const on = c.dia === dia;
          const feitos = c.blocos.filter((_, i) => itens[chaveBloco(c.dia, i)]).length;
          const completo = c.blocos.length > 0 && feitos === c.blocos.length;
          return (
            <Pressable key={c.dia} onPress={() => setDia(c.dia)} role="tab" aria-selected={on} style={[styles.diaPill, on && styles.diaPillOn]}>
              <Text style={[styles.diaPillT, on && { color: colors.white }]}>
                {diaInfo(c.dia).l}
                {c.dia === hojeKey() ? ' •' : ''}
              </Text>
              <Text style={[styles.diaPillS, on ? { color: '#e0e7ff' } : completo && { color: colors.greenText, fontWeight: '700' }]}>
                {completo ? 'Concluído' : `${feitos}/${c.blocos.length}`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, color: colors.dark }}>
          {diaInfo(atual.dia).full}
          {atual.dia === hojeKey() ? '  ' : ''}
          {atual.dia === hojeKey() && <Text style={styles.hoje}> Hoje </Text>}
        </Text>
        {atual.foco ? (
          <Text style={{ flexShrink: 1, fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
            Foco: {atual.foco}
          </Text>
        ) : null}
      </View>

      {atual.blocos.length === 0 && <Card><Muted>Nenhum bloco para este dia.</Muted></Card>}
      {atual.blocos.map((b, i) => {
        const chave = chaveBloco(atual.dia, i);
        const feito = !!itens[chave];
        const at = ATIVIDADES[b.atividade] ?? ATIVIDADES.teoria;
        return (
          <View key={chave} style={[styles.bloco, feito && styles.blocoFeito]}>
            <Pressable
              onPress={() => onMarcar(chave, !feito)}
              role="checkbox"
              aria-checked={feito}
              accessibilityLabel={`Marcar ${b.materia} como concluído`}
              style={{ flexDirection: 'row', gap: 12 }}
            >
              <View style={[styles.check, feito && styles.checkOn]}>{feito && <Icon name="checkmark" size={16} color={colors.white} />}</View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={[styles.blocoMat, feito && styles.riscado]}>{b.materia}</Text>
                  <Text style={styles.blocoMin}>{fmtMin(b.minutos)}</Text>
                </View>
                <Text style={[styles.blocoAss, feito && styles.riscado]}>{b.assunto}</Text>
                <Tag label={at.label} icon={at.icon} bg={at.bg} fg={at.fg} />
              </View>
            </Pressable>
            <Button
              label={feito ? 'Estudar de novo com a IA' : 'Estudar com a IA'}
              icon="chatbubble-ellipses-outline"
              variant={feito ? 'outline' : 'primary'}
              small
              onPress={() => estudarComIA({ materia: b.materia, assunto: b.assunto, atividade: b.atividade, minutos: b.minutos })}
              style={{ marginTop: 12 }}
            />
          </View>
        );
      })}

      {!pro && atual.dia === hojeKey() && perfil.bonusToday > 0 && (
        <View style={styles.bonus}>
          <Icon name="gift-outline" size={20} color={colors.amberText} />
          <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>
            Você ganhou <B>+{perfil.bonusToday} min</B> hoje. Use para revisar ou tirar dúvidas no Tutor IA.
          </Text>
        </View>
      )}
      {!pro && (
        <Pressable onPress={onAnuncio} accessibilityRole="button" style={styles.anuncioBtn}>
          <Icon name="play-circle-outline" size={18} color={colors.amberText} />
          <Text style={{ color: colors.amberText, fontWeight: '700', fontSize: 14, textAlign: 'center', flexShrink: 1 }}>
            Assistir anúncio e ganhar +{perfil.adBonus} min hoje ({perfil.adsToday}/{perfil.adMaxPerDay})
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------- Análise
function Analise({ plano }: { plano: Plano }) {
  const d = plano.dados;
  return (
    <View style={{ gap: 14 }}>
      {d.resumo ? (
        <View style={styles.resumo}>
          <Icon name="bulb-outline" size={20} color={colors.primary} />
          <Text style={{ flex: 1, fontSize: 14, lineHeight: 21, color: colors.text }}>{d.resumo}</Text>
        </View>
      ) : null}

      <Card style={{ gap: 14 }}>
        <Secao icon="locate-outline" titulo="Matérias e assuntos que mais caem" />
        <Muted style={{ fontSize: 13 }}>
          O <B>percentual</B> mostra quanto cada matéria pesa na prova (fatia aproximada das questões). As etiquetas são os assuntos, coloridos pela frequência com que aparecem. <B>Toque em uma matéria ou assunto</B> para estudá-lo com o Tutor IA.
        </Muted>
        <View style={styles.legenda}>
          {(['alta', 'media', 'baixa'] as const).map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: INCIDENCIA[k].fg }} />
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{INCIDENCIA[k].label}</Text>
            </View>
          ))}
        </View>
        {d.materias.map((m) => (
          <View key={m.nome} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={() => estudarComIA({ materia: m.nome })} accessibilityRole="link" accessibilityLabel={`Estudar ${m.nome} com a IA`} style={styles.materiaLink}>
                <Text style={styles.materiaNome}>
                  {m.nome} <Icon name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
                </Text>
              </Pressable>
              <Text style={{ fontWeight: '800', color: colors.primary }}>{Math.round(m.peso)}%</Text>
            </View>
            <ProgressBar pct={m.peso} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {m.assuntos.map((a) => {
                const inc = INCIDENCIA[a.incidencia] ?? INCIDENCIA.baixa;
                return (
                  <Pressable
                    key={a.nome}
                    onPress={() => estudarComIA({ materia: m.nome, assunto: a.nome })}
                    accessibilityRole="link"
                    accessibilityLabel={`Estudar ${a.nome} com a IA`}
                    style={[styles.assunto, { backgroundColor: inc.bg, borderColor: inc.border }]}
                  >
                    <Text style={{ fontSize: 13, color: inc.fg }}>{a.nome}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </Card>

      {d.tiposQuestao.length > 0 && (
        <Card style={{ gap: 12 }}>
          <Secao icon="shapes-outline" titulo="Tipos de questão" />
          {d.tiposQuestao.map((t) => (
            <View key={t.tipo} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ flex: 1, fontWeight: '600', color: colors.text }}>{t.tipo}</Text>
                <Text style={{ fontWeight: '800', color: colors.emerald }}>{Math.round(t.percentual)}%</Text>
              </View>
              <ProgressBar pct={t.percentual} color={colors.emerald} height={6} />
              {t.dica ? <Muted style={{ fontSize: 13 }}>{t.dica}</Muted> : null}
            </View>
          ))}
        </Card>
      )}

      {d.dicas.length > 0 && (
        <Card style={{ gap: 10 }}>
          <Secao icon="flag-outline" titulo="Estratégia" />
          {d.dicas.map((x) => (
            <View key={x} style={{ flexDirection: 'row', gap: 8 }}>
              <Icon name="checkmark" size={16} color={colors.green} />
              <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>{x}</Text>
            </View>
          ))}
        </Card>
      )}

      {d.provasAnalisadas.length > 0 && (
        <Card style={{ gap: 10 }}>
          <Secao icon="document-text-outline" titulo={`Provas analisadas (${d.provasAnalisadas.length})`} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[...d.provasAnalisadas]
              .sort((a, b) => (b.ano ?? 0) - (a.ano ?? 0))
              .map((p, i) => (
                <Text key={i} style={styles.prova}>
                  <B>{String(p.ano ?? '')}</B> · {p.banca}
                  {p.cargo ? ` · ${p.cargo}` : ''}
                </Text>
              ))}
          </View>
        </Card>
      )}

      {plano.fontes.length > 0 && (
        <Card style={{ gap: 10 }}>
          <Secao icon="globe-outline" titulo="Fontes consultadas pela IA" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {plano.fontes.map((f) => (
              <Pressable key={f.url} onPress={() => Linking.openURL(f.url)} accessibilityRole="link" style={styles.fonte}>
                <Icon name="open-outline" size={12} />
                <Text style={{ fontSize: 13, color: colors.textMuted, flexShrink: 1 }}>{f.titulo}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      <Text style={{ fontSize: 12, color: colors.textSubtle, textAlign: 'center', paddingHorizontal: 12 }}>
        Análise gerada por IA a partir de fontes públicas da internet. Os percentuais são estimativas — confira sempre o edital oficial do seu concurso.
      </Text>
    </View>
  );
}

function Secao({ icon, titulo }: { icon: IconName; titulo: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon name={icon} size={20} color={colors.primary} />
      <Text style={{ flex: 1, fontWeight: '700', fontSize: 16, color: colors.dark }}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.dark, borderRadius: radius.lg, padding: 20, gap: 4 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#a5b4fc' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: colors.white },
  heroSub: { fontSize: 14, color: '#cbd5e1' },
  heroBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
  heroBtnClaro: { backgroundColor: '#ffffff1a', borderColor: 'transparent' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  stat: { flexGrow: 1, flexBasis: '45%', backgroundColor: '#ffffff0d', borderWidth: 1, borderColor: '#ffffff1a', borderRadius: radius.md, padding: 12, gap: 2 },
  statBig: { color: colors.white, fontWeight: '700', fontSize: 15 },
  statSmall: { color: '#94a3b8', fontSize: 12 },
  progHead: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 6 },
  progText: { fontSize: 12, color: '#cbd5e1' },
  abas: { flexDirection: 'row', gap: 4, padding: 4, backgroundColor: '#e2e8f099', borderRadius: radius.md, marginVertical: 16 },
  aba: { flex: 1, minHeight: TOUCH, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  abaOn: { backgroundColor: colors.white },
  abaText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  pro: { fontSize: 9, fontWeight: '800', color: colors.white, backgroundColor: colors.primary, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' },
  abrirGuia: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: TOUCH, alignSelf: 'flex-start' },
  fechar: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center', margin: -10 },
  numCheio: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.primary, color: colors.white, fontWeight: '800', fontSize: 12, textAlign: 'center', lineHeight: 24 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, borderTopWidth: 1, borderTopColor: colors.surface, paddingTop: 10 },
  diaPill: { minWidth: 76, minHeight: 56, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  diaPillOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  diaPillT: { fontWeight: '700', fontSize: 14, color: colors.text },
  diaPillS: { fontSize: 12, color: colors.textSubtle },
  hoje: { fontSize: 12, fontWeight: '700', color: colors.primary, backgroundColor: colors.primarySoft, borderRadius: radius.full, overflow: 'hidden' },
  bloco: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14 },
  blocoFeito: { borderColor: '#bbf7d0', backgroundColor: '#f0fdf466' },
  check: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  blocoMat: { flex: 1, fontWeight: '700', fontSize: 15, color: colors.dark },
  blocoMin: { fontWeight: '700', fontSize: 14, color: colors.textMuted },
  blocoAss: { fontSize: 14, color: colors.textMuted },
  riscado: { textDecorationLine: 'line-through', color: colors.textSubtle },
  bonus: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.amberBorder, backgroundColor: colors.amberSoft },
  anuncioBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: '#fcd34d' },
  resumo: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: radius.lg, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder },
  materiaLink: { flex: 1, minHeight: 36, justifyContent: 'center' },
  materiaNome: { fontWeight: '700', fontSize: 15, color: colors.text },
  assunto: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, minHeight: 32, justifyContent: 'center' },
  prova: { fontSize: 13, color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm, overflow: 'hidden' },
  fonte: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, minHeight: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, maxWidth: '100%' },
});
