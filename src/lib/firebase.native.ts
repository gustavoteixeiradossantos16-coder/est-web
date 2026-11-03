// Versão celular: a sessão precisa ser salva no AsyncStorage,
// senão a pessoa é deslogada toda vez que fecha o app.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

import { firebaseConfig } from './config';

const primeiraVez = getApps().length === 0;
export const app = primeiraVez ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = primeiraVez
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
