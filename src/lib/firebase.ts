// Versão web: a sessão fica salva no navegador (padrão do Firebase).
// No celular o Metro usa firebase.native.ts.
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { firebaseConfig } from './config';

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
