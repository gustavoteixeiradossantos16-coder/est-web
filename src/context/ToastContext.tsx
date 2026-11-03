import Ionicons from '@expo/vector-icons/Ionicons';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/lib/theme';

type Tipo = 'info' | 'success' | 'error';
const ToastContext = createContext<(msg: string, tipo?: Tipo) => void>(() => {});

const COR: Record<Tipo, string> = { info: colors.primary, success: colors.green, error: colors.red };
const ICONE = { info: 'information-circle', success: 'checkmark-circle', error: 'alert-circle' } as const;

/** Aviso rápido no topo da tela (some sozinho em 3,5 s). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; tipo: Tipo } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const mostrar = useCallback((msg: string, tipo: Tipo = 'info') => {
    setToast({ msg, tipo });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      {toast && (
        <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 12 }]}>
          <View style={[styles.toast, { borderLeftColor: COR[toast.tipo] }]} accessibilityLiveRegion="polite" role="alert">
            <Ionicons name={ICONE[toast.tipo]} size={22} color={COR[toast.tipo]} />
            <Text style={styles.msg}>{toast.msg}</Text>
          </View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderLeftWidth: 4,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: 480,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  msg: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.text },
});
