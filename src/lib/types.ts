// Formatos devolvidos pela API (est-api)

export interface Perfil {
  email: string;
  plan: 'free' | 'pro';
  minutesToday: number;
  dailyLimit: number | null; // null = ilimitado (Premium)
  bonusToday: number;
  adsToday: number;
  adMaxPerDay: number;
  adBonus: number;
  freeMaxDays: number;
  freeMinutes: number;
  limitReached: boolean;
}

export type Atividade = 'teoria' | 'questoes' | 'revisao';
export type Incidencia = 'alta' | 'media' | 'baixa';

export interface Bloco {
  materia: string;
  assunto: string;
  minutos: number;
  atividade: Atividade;
}

export interface DiaCronograma {
  dia: string;
  foco: string;
  blocos: Bloco[];
}

export interface Materia {
  nome: string;
  peso: number;
  assuntos: { nome: string; incidencia: Incidencia }[];
}

export interface DadosPlano {
  concurso: string;
  cargoConsiderado: string;
  bancas: string[];
  periodo: string;
  provasAnalisadas: { ano?: number; banca?: string; cargo?: string }[];
  resumo: string;
  materias: Materia[];
  tiposQuestao: { tipo: string; percentual: number; dica: string }[];
  cronograma: DiaCronograma[];
  dicas: string[];
}

export interface Plano {
  concursoId: string | null;
  concurso: string;
  cargo: string;
  dias: string[];
  minutosDia: number;
  progresso: { semana: string; itens: Record<string, boolean> };
  dados: DadosPlano;
  fontes: { titulo: string; url: string }[];
  criadoEm: string | null;
}

export interface Questao {
  enunciado: string;
  alternativas: { letra: string; texto: string }[];
  correta: string;
  explicacao: string;
  fonte: string;
  origem: 'prova_anterior' | 'inedita';
}

export interface MensagemIA {
  role: 'user' | 'model';
  parts: { text: string }[];
}
