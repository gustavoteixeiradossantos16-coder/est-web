import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from '@/context/SessionContext';
import { ToastProvider } from '@/context/ToastContext';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Telas() {
  const { carregando } = useSession();
  // Esconde a tela de abertura só depois que o Firebase disser se há alguém logado
  useEffect(() => {
    if (!carregando) SplashScreen.hideAsync().catch(() => {});
  }, [carregando]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" options={{ title: 'StudyTimeIA' }} />
      <Stack.Screen name="auth" options={{ title: 'Entrar · StudyTimeIA' }} />
      <Stack.Screen name="plano" options={{ title: 'Meu plano de estudos · StudyTimeIA' }} />
      <Stack.Screen name="tutor" options={{ title: 'Tutor IA · StudyTimeIA' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Telas />
        </ToastProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
