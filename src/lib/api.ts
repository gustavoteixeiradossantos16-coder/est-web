// Cliente da API em Python. Todas as chamadas levam o token de login do Firebase.
import { API_URL } from './config';
import { auth } from './firebase';
import type { Atividade, MensagemIA, Perfil, Plano, Questao } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public codigo: string,
  ) {
    super(message);
  }
}

async function request<T>(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new ApiError('Faça login para continuar.', 401, 'NAO_AUTENTICADO');
  const token = await user.getIdToken();

  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Sem conexão com o servidor. Verifique sua internet e tente novamente.', 0, 'SEM_CONEXAO');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.erro || 'Ocorreu um erro. Tente novamente.', res.status, data.codigo || 'ERRO');
  }
  return data as T;
}

export const api = {
  me: () => request<Perfil>('GET', '/me'),
  somarMinuto: () => request<Perfil>('POST', '/me/minutos'),
  recompensaAnuncio: () => request<Perfil>('POST', '/me/anuncio'),
  upgrade: () => request<Perfil>('POST', '/me/upgrade'),

  plano: () => request<{ plano: Plano | null }>('GET', '/plano').then((r) => r.plano),
  gerarPlano: (dados: { concursoId: string | null; concurso: string; cargo: string; dias: string[]; minutos: number }) =>
    request<{ plano: Plano }>('POST', '/plano', dados).then((r) => r.plano),
  marcarProgresso: (chave: string, feito: boolean) =>
    request<{ progresso: Plano['progresso'] }>('PATCH', '/plano/progresso', { chave, feito }).then((r) => r.progresso),

  questoes: (materia: string, assunto: string, qtd: number) =>
    request<{ questoes: Questao[]; materia: string }>('POST', '/questoes', { materia, assunto, qtd }),

  chat: (mensagem: string, historico: MensagemIA[]) =>
    request<{ resposta: string; historico: MensagemIA[] }>('POST', '/chat', { mensagem, historico }),
  chatEstudo: (dados: { materia: string; assunto?: string; atividade?: Atividade; minutos?: number }) =>
    request<{ mensagem: string; resposta: string; historico: MensagemIA[] }>('POST', '/chat/estudo', dados),
};
