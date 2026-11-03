// Área logada: Sidebar padrão + telas (Plano e Tutor).
// - Tela larga (>= 900 px): sidebar FIXA à esquerda (drawerType "permanent").
// - Celular: a sidebar vira um menu lateral (abre pelo botão ☰ ou arrastando da borda).
// As telas ficam montadas ao trocar de aba: nada recarrega ao ir do Plano para o Tutor e voltar.
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useWindowDimensions } from 'react-native';

import { ModalsProvider } from '@/components/Modals';
import { MobileHeader, Sidebar, SIDEBAR_FIXA_A_PARTIR_DE, SIDEBAR_LARGURA } from '@/components/Sidebar';
import { useSession } from '@/context/SessionContext';
import { colors } from '@/lib/theme';

export default function AppLayout() {
  const { carregando, user } = useSession();
  const { width } = useWindowDimensions();

  // A tela de abertura (splash) continua visível enquanto o Firebase responde
  if (carregando) return null;
  if (!user) return <Redirect href="/" />;

  const fixa = width >= SIDEBAR_FIXA_A_PARTIR_DE;

  return (
    <ModalsProvider>
      <Drawer
        drawerContent={(props) => <Sidebar {...props} fixa={fixa} />}
        screenOptions={{
          drawerType: fixa ? 'permanent' : 'front',
          drawerStyle: {
            width: fixa ? SIDEBAR_LARGURA : Math.min(SIDEBAR_LARGURA + 24, width * 0.84),
            backgroundColor: colors.white,
            borderRightWidth: fixa ? 1 : 0,
            borderRightColor: colors.border,
          },
          overlayColor: '#0f172a73',
          swipeEdgeWidth: 32,
          headerShown: !fixa,
          header: (props) => <MobileHeader {...props} />,
          sceneStyle: { backgroundColor: colors.background },
          freezeOnBlur: true, // tela em segundo plano não renderiza à toa
        }}
      >
        <Drawer.Screen name="plano" options={{ title: 'Meu plano de estudos', drawerLabel: 'Meu plano' }} />
        <Drawer.Screen name="tutor" options={{ title: 'Tutor IA', drawerLabel: 'Tutor IA' }} />
      </Drawer>
    </ModalsProvider>
  );
}
