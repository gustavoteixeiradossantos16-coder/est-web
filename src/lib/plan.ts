// Listas e funções do plano de estudos usadas nas telas
import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

import type { Atividade, Plano } from './types';
import { colors } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const ANOS_ANALISE = 15;
export const ANO_FIM = new Date().getFullYear();
export const ANO_INI = ANO_FIM - ANOS_ANALISE + 1;

export const CONCURSOS: { id: string; nome: string; area: string; icon: IconName }[] = [
  { id: 'ebserh', nome: 'EBSERH', area: 'Saúde · Hospitais', icon: 'pulse-outline' },
  { id: 'bb', nome: 'Banco do Brasil', area: 'Bancário', icon: 'business-outline' },
  { id: 'caixa', nome: 'Caixa Econômica', area: 'Bancário', icon: 'wallet-outline' },
  { id: 'petrobras', nome: 'Petrobras', area: 'Petróleo e Energia', icon: 'flame-outline' },
  { id: 'inss', nome: 'INSS', area: 'Previdência', icon: 'shield-outline' },
  { id: 'correios', nome: 'Correios', area: 'Logística', icon: 'mail-outline' },
  { id: 'pf', nome: 'Polícia Federal', area: 'Segurança Pública', icon: 'ribbon-outline' },
  { id: 'prf', nome: 'PRF', area: 'Segurança Pública', icon: 'car-outline' },
  { id: 'receita', nome: 'Receita Federal', area: 'Fiscal', icon: 'receipt-outline' },
  { id: 'ibge', nome: 'IBGE', area: 'Pesquisa e Estatística', icon: 'stats-chart-outline' },
  { id: 'tribunais', nome: 'Tribunais (TJ/TRT/TRF)', area: 'Judiciário', icon: 'scale-outline' },
  { id: 'bnb', nome: 'Banco do Nordeste', area: 'Bancário', icon: 'business-outline' },
  { id: 'outro', nome: 'Outro concurso', area: 'Digite o nome', icon: 'add-outline' },
];

export const DIAS = [
  { k: 'seg', l: 'Seg', full: 'Segunda' },
  { k: 'ter', l: 'Ter', full: 'Terça' },
  { k: 'qua', l: 'Qua', full: 'Quarta' },
  { k: 'qui', l: 'Qui', full: 'Quinta' },
  { k: 'sex', l: 'Sex', full: 'Sexta' },
  { k: 'sab', l: 'Sáb', full: 'Sábado' },
  { k: 'dom', l: 'Dom', full: 'Domingo' },
];

export const TEMPOS_FREE = [30, 60, 90, 120];
export const TEMPOS_PRO = [30, 60, 90, 120, 180, 240, 300, 360];

export const ATIVIDADES: Record<Atividade, { label: string; icon: IconName; bg: string; fg: string; explica: string }> = {
  teoria: { label: 'Teoria', icon: 'book-outline', bg: colors.primarySoft, fg: colors.primaryDark, explica: 'aprender o conteúdo' },
  questoes: { label: 'Questões', icon: 'create-outline', bg: colors.emeraldSoft, fg: colors.emeraldText, explica: 'treinar no estilo da banca' },
  revisao: { label: 'Revisão', icon: 'refresh-outline', bg: colors.amberSoft, fg: colors.amberText, explica: 'fixar o que já estudou' },
};

export const INCIDENCIA = {
  alta: { bg: colors.redSoft, fg: colors.redText, border: '#fee2e2', label: 'Alta' },
  media: { bg: colors.amberSoft, fg: colors.amberText, border: '#fef3c7', label: 'Média' },
  baixa: { bg: colors.background, fg: colors.textMuted, border: colors.border, label: 'Baixa incidência' },
};

export const diaInfo = (k: string) => DIAS.find((d) => d.k === k) ?? { k, l: k, full: k };
export const ordenarDias = (dias: string[]) => DIAS.map((d) => d.k).filter((k) => dias.includes(k));
export const hojeKey = () => ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date().getDay()];
export const chaveBloco = (dia: string, i: number) => `${dia}_${i}`;

export function fmtMin(m: number) {
  const t = Math.round(Number(m) || 0);
  if (t < 60) return `${t} min`;
  const h = Math.floor(t / 60);
  const r = t % 60;
  return r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`;
}

export function progressoSemana(plano: Plano) {
  const itens = plano.progresso?.itens ?? {};
  let total = 0;
  let feitos = 0;
  plano.dados.cronograma.forEach((d) =>
    d.blocos.forEach((_, i) => {
      total++;
      if (itens[chaveBloco(d.dia, i)]) feitos++;
    }),
  );
  return { total, feitos, pct: total ? Math.round((feitos / total) * 100) : 0 };
}

export function nomeConcurso(concursoId: string | null, outro: string) {
  if (concursoId === 'outro') return outro.trim();
  return CONCURSOS.find((c) => c.id === concursoId)?.nome ?? '';
}
