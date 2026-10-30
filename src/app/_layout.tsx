import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from '@/context/SessionContext';
import { colors } from '@/lib/theme';

function RootNavigator() {
  const { loading, user, profile } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const signedIn = user !== null;
  const hasStudyPlan = !!profile?.goal && (profile?.studyDays.length ?? 0) > 0;

  // Rotas protegidas: o protótipo nunca mostrava o onboarding; aqui ele é obrigatório antes do painel
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !hasStudyPlan}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && hasStudyPlan}>
        <Stack.Screen name="dashboard" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
