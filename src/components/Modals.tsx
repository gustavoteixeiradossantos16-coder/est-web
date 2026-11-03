import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/context/SessionContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { colors, radius, TOUCH } from '@/lib/theme';

import { Button, Icon, ProgressBar } from './ui';

const AD_SECONDS = 15; // duração do anúncio simulado

function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>{children}</View>
      </View>
    </Modal>
  );
}

/** Plano Premium (pagamento simulado: a API ativa o plano sem cobrança). */
export function UpgradeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { setPerfil } = useSession();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function assinar() {
    setLoading(true);
    try {
      setPerfil(await api.upgrade());
      onClose();
      toast('Assinatura Premium ativada! Bons estudos.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao processar o pagamento.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const itens = ['Estude os 7 dias da semana', 'Tempo de estudo ilimitado, sem anúncios', 'Questões de provas anteriores com correção'];
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.proHead}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar" style={styles.close}>
          <Icon name="close" size={22} color="#cbd5e1" />
        </Pressable>
        <Text style={styles.proTitle}>Plano Premium</Text>
        <Text style={styles.proSub}>Investimento na sua aprovação</Text>
        <Text style={styles.proPrice}>
          R$ 29,90<Text style={{ fontSize: 14, fontWeight: '400' }}>/mês</Text>
        </Text>
      </View>
      <View style={{ padding: 20, gap: 12 }}>
        {itens.map((t) => (
          <View key={t} style={styles.item}>
            <Icon name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.itemText}>{t}</Text>
          </View>
        ))}
        <Button label="Confirmar assinatura" onPress={assinar} loading={loading} style={{ marginTop: 12 }} />
        <Text style={styles.fine}>Pagamento seguro processado via Stripe.</Text>
      </View>
    </Sheet>
  );
}

/** Anúncio recompensado do plano Free: depois de 15 s libera +15 min de estudo hoje. */
export function AdModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      {visible && <Anuncio onClose={onClose} />}
    </Sheet>
  );
}

function Anuncio({ onClose }: { onClose: () => void }) {
  const { perfil, setPerfil } = useSession();
  const toast = useToast();
  const [restante, setRestante] = useState(AD_SECONDS);
  const [resgatando, setResgatando] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setRestante((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  async function resgatar() {
    setResgatando(true);
    try {
      const p = await api.recompensaAnuncio();
      setPerfil(p);
      onClose();
      toast(`+${p.adBonus} min liberados! Hoje você tem ${p.dailyLimit} min de estudo.`, 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não foi possível liberar o bônus.', 'error');
    } finally {
      setResgatando(false);
    }
  }

  const pronto = restante <= 0;
  return (
    <>
      <View style={styles.adTop}>
        <Text style={styles.adLabel}>ANÚNCIO</Text>
        {!pronto && (
          <Pressable onPress={onClose} accessibilityRole="button" style={{ minHeight: TOUCH, justifyContent: 'center' }}>
            <Text style={styles.adLabel}>Fechar sem recompensa</Text>
          </Pressable>
        )}
      </View>
      {/* Aqui entra o anúncio real (ex.: Google AdMob / Ad Manager no formato "rewarded"). */}
      <View style={styles.adSlot}>
        <Icon name="tv-outline" size={40} color="#ffffffb3" />
        <Text style={{ color: '#ffffffcc', fontSize: 14 }}>Espaço do anunciante</Text>
      </View>
      <View style={{ padding: 20, gap: 12 }}>
        <ProgressBar pct={((AD_SECONDS - restante) / AD_SECONDS) * 100} color={colors.amber} height={6} track={colors.border} />
        <Text style={styles.adStatus}>{pronto ? 'Pronto! Recompensa liberada.' : `Sua recompensa será liberada em ${restante}s…`}</Text>
        {pronto && (
          <Button label={`Resgatar +${perfil?.adBonus ?? 15} min`} icon="gift-outline" variant="amber" onPress={resgatar} loading={resgatando} />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#0f172acc', alignItems: 'center', justifyContent: 'center', padding: 16 },
  sheet: { width: '100%', maxWidth: 440, backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  proHead: { backgroundColor: colors.dark, padding: 24, alignItems: 'center' },
  close: { position: 'absolute', top: 6, right: 6, width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  proTitle: { color: colors.white, fontSize: 24, fontWeight: '800' },
  proSub: { color: '#cbd5e1', fontSize: 14, marginTop: 4 },
  proPrice: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemText: { flex: 1, fontSize: 14, color: colors.text },
  fine: { textAlign: 'center', fontSize: 12, color: colors.textSubtle },
  adTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, minHeight: 44, borderBottomWidth: 1, borderBottomColor: colors.surface },
  adLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  adSlot: { aspectRatio: 16 / 9, backgroundColor: '#312e81', alignItems: 'center', justifyContent: 'center', gap: 8 },
  adStatus: { textAlign: 'center', fontSize: 14, color: colors.textMuted },
});

// ---------------------------------------------------------------- acesso global às janelas
interface ModalsApi {
  abrirUpgrade: () => void;
  abrirAnuncio: () => void;
}
const ModalsContext = createContext<ModalsApi>({ abrirUpgrade: () => {}, abrirAnuncio: () => {} });

/** Deixa as janelas de Premium e de anúncio disponíveis para a sidebar e para todas as telas logadas. */
export function ModalsProvider({ children }: { children: ReactNode }) {
  const [upgrade, setUpgrade] = useState(false);
  const [anuncio, setAnuncio] = useState(false);
  const api = useMemo<ModalsApi>(() => ({ abrirUpgrade: () => setUpgrade(true), abrirAnuncio: () => setAnuncio(true) }), []);
  return (
    <ModalsContext.Provider value={api}>
      {children}
      <UpgradeModal visible={upgrade} onClose={() => setUpgrade(false)} />
      <AdModal visible={anuncio} onClose={() => setAnuncio(false)} />
    </ModalsContext.Provider>
  );
}

export const useModals = () => useContext(ModalsContext);
