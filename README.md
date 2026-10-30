# est-web

App do **StudyTimeIA**, o tutor de concursos com IA, em React Native com Expo (Android, iOS e web), conectado ao Firebase (projeto `studytimeia`). O back-end fica em [est-api](https://github.com/gustavoteixeiradossantos16-coder/est-api).

Fluxo de branches:

- `main`: produção (padrão)
- `develop`: desenvolvimento (base das features)
- `qas`: homologação (recebe da develop)

Trabalhe em branches `feature/*` a partir da `develop` e abra PRs pequenos para a `develop`.

## Rodando

Pré-requisito: Node.js 20 ou mais novo.

```bash
npm install
npx expo start
```

Abra no celular pelo app **Expo Go** (QR code), aperte `w` para a versão web ou `a`/`i` para os emuladores.

```bash
npm run typecheck
npm run lint
```

> O tutor IA e o contador de minutos dependem das Cloud Functions do `est-api` publicadas (região `southamerica-east1`). Até lá, o login, o cadastro e o onboarding já funcionam, mas o chat responde com erro de conexão.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/app/index.tsx` | Página inicial com os planos |
| `src/app/auth.tsx` | Login, cadastro e "esqueci minha senha" |
| `src/app/onboarding.tsx` | Foco de estudo e dias da semana |
| `src/app/dashboard.tsx` | Chat com o tutor, cronômetro, progresso do plano e bloqueio |
| `src/app/_layout.tsx` | Rotas protegidas: visitante, onboarding pendente ou painel |
| `src/context/SessionContext.tsx` | Usuário logado e perfil em tempo real |
| `src/lib/firebase.ts` | Inicialização do Firebase (sessão salva no aparelho) |
| `src/lib/api.ts` | Leitura e escrita do perfil e chamadas às funções do `est-api` |
| `src/lib/plan.ts` | Regras de plano usadas na interface (cópia de `est-api/functions/src/plan.ts`) |

## O que mudou em relação ao protótipo `index2.html`

| Problema no protótipo | Como ficou |
|---|---|
| A tela de login e cadastro não existia, o script quebrava ao carregar e ninguém conseguia entrar | Tela `auth` completa, com mensagens de erro em português e recuperação de senha |
| A tela de onboarding existia, mas nunca aparecia nem salvava nada | Obrigatória após o cadastro. Salva foco e dias, e o foco vai para a IA |
| A chave do Gemini ia no HTML (pública) e nem estava definida, então o chat sempre falhava | A IA é chamada pela função `askTutor` no servidor, e a chave nunca chega ao app |
| "Confirmar Assinatura" virava Premium sem pagar, gravando `plan: 'pro'` pelo navegador | O plano só muda pelo servidor. O botão fica como "em breve" até o pagamento ser integrado |
| O navegador gravava `minutesToday`, e o usuário podia zerar o próprio limite | O minuto é registrado pela função `trackStudyMinute`, que ignora chamadas repetidas |
| Regras do Firestore abertas (dados legíveis sem login) | Regras novas no `est-api`: cada usuário só vê o próprio perfil |
| "4 dias por semana" era anunciado, mas não aplicado | Gratuito escolhe até 4 dias e só estuda neles |
| O dia virava à meia-noite UTC, ou seja, o contador zerava às 21h | Dia contado no fuso de Brasília |
| O caminho `artifacts/concursa-ia-local-app/users/...` era herdado do ambiente onde o protótipo foi gerado | `users/{uid}` |
| A resposta da IA entrava com `innerHTML` (risco de XSS) | Texto puro |
| O cronômetro contava com a aba em segundo plano | Conta só com o app aberto |
| O histórico do chat crescia sem limite, e a IA se chamava "ConcursaIA" | Últimas 20 mensagens, e o nome é StudyTimeIA |
| `signInWithCustomToken` era usado sem import | Removido (era resto do ambiente de geração) |
