// Endereço da API em Python (repositório est-api).
// Defina EXPO_PUBLIC_API_URL no .env (local) ou nas variáveis de ambiente do deploy.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

// Configuração pública do app web "studytimeia" no Firebase.
// Não é segredo: o app usa o Firebase só para login; dados e IA passam pela API.
export const firebaseConfig = {
  apiKey: 'AIzaSyBKXG-xqfpNkpw2wHfuxtYTDZNuW1vLxtg',
  authDomain: 'studytimeia.firebaseapp.com',
  projectId: 'studytimeia',
  storageBucket: 'studytimeia.firebasestorage.app',
  messagingSenderId: '179105165714',
  appId: '1:179105165714:web:91f8d4a1ae5f8a6a30114b',
  measurementId: 'G-LDVUGSYMPY',
};
