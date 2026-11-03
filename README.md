# est-web

App do **StudyTimeIA** em **React Native (Expo)** — roda no navegador, no Android e no iPhone com o mesmo código.

O app só cuida da tela e do login (Firebase Auth). Plano de estudos, chat com a IA, limites dos planos
e dados ficam no back-end em Python: [est-api](https://github.com/gustavoteixeiradossantos16-coder/est-api).

## Telas

A área logada tem uma **sidebar padrão** (Expo Router Drawer): fixa à esquerda em telas a partir de 900 px
e menu lateral (botão ☰ ou arrastar da borda) no celular. Plano e Tutor ficam montados ao trocar de tela,
então a navegação não recarrega nada.

| Rota | O que faz |
|---|---|
| `/` | Página inicial e planos (Free / Premium) |
| `/auth` | Login e cadastro (se o e-mail já existir com a mesma senha, entra direto) |
| `/plano` | Assistente em 3 passos → plano gerado pela IA: cronograma, análise das provas e questões (Premium) |
| `/tutor` | Chat com o Tutor IA. Vindo de **"Estudar com a IA"**, já envia o pedido da matéria sozinho |

Feito **mobile first**: testado em 360 px, 390 px e 1280 px, sem rolagem lateral, margens de 12–24 px conforme a tela e áreas de toque de 44 px.
O chat mostra o texto da IA em 14 px, com as quebras de linha (`
`) preservadas.

## Rodando localmente

```bash
npm install
copy .env.example .env        # aponte EXPO_PUBLIC_API_URL para a est-api
npx expo start                # w = navegador, a = Android, i = iPhone (ou leia o QR code no Expo Go)
```

A est-api precisa estar rodando (`uvicorn app.main:app --port 8000`) e com `CORS_ORIGINS`
incluindo o endereço do app (no `expo start --web` é `http://localhost:8081`).

Antes de abrir PR:

```bash
npm run typecheck
npm run lint
npm run build:web             # gera a versão web em dist/
```

## Deploy

- **Web (Vercel)**: o `vercel.json` já faz o build (`expo export`) e publica `dist/`.
  Configure `EXPO_PUBLIC_API_URL` com o endereço da est-api publicada.
  Na est-api, coloque o endereço do est-web em `CORS_ORIGINS`.
- **Celular**: `npx eas-cli@latest build` (Android/iOS) — veja https://docs.expo.dev/eas/.

## Estrutura

```
src/
  app/          telas (Expo Router: cada arquivo é uma rota)
  components/   componentes (ui, cabeçalho, modais, telas do plano)
  context/      sessão (login + perfil) e avisos (toast)
  lib/          api.ts (cliente da est-api), firebase, tipos, tema e regras de exibição
```

## Fluxo de branches

- `main`: produção (padrão)
- `develop`: desenvolvimento (base das features)
- `qas`: homologação (recebe da develop)

Trabalhe em branches `feature/*` a partir da `develop` e abra PRs pequenos para a `develop`.
