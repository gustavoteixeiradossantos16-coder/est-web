import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';

// Configuração pública do app web "studytimeia" (não é segredo: vai junto com qualquer cliente).
// A segurança vem das regras do Firestore e das Cloud Functions no repositório est-api.
const firebaseConfig = {
  apiKey: 'AIzaSyBKXG-xqfpNkpw2wHfuxtYTDZNuW1vLxtg',
  authDomain: 'studytimeia.firebaseapp.com',
  projectId: 'studytimeia',
  storageBucket: 'studytimeia.firebasestorage.app',
  messagingSenderId: '179105165714',
  appId: '1:179105165714:web:91f8d4a1ae5f8a6a30114b',
  measurementId: 'G-LDVUGSYMPY',
};

// Mesma região em que as funções são publicadas no est-api (São Paulo)
export const FUNCTIONS_REGION = 'southamerica-east1';

const isFirstInit = getApps().length === 0;
export const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

function createAuth(): Auth {
  // No celular a sessão precisa ser persistida no AsyncStorage, senão o usuário é deslogado ao fechar o app
  if (Platform.OS === 'web' || !isFirstInit) return getAuth(app);
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

export const auth = createAuth();
export const db = getFirestore(app);
export const functions = getFunctions(app, FUNCTIONS_REGION);
