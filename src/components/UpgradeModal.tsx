import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Check } from '@/components/ui';
import { PREMIUM_PRICE } from '@/lib/plan';
import { colors } from '@/lib/theme';

// O protótipo "confirmava" a assinatura gravando plan: 'pro' direto do navegador, sem pagamento.
// Agora o plano só muda pelo servidor (webhook do meio de pagamento no est-api), então o botão fica desativado.
export function UpgradeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.close} hitSlop={12} accessibilityLabel="Fechar">
              <Ionicons name="close" size={22} color={colors.textSubtle} />
            </Pressable>
            <Text style={styles.title}>Plano Premium</Text>
            <Text style={styles.subtitle}>Investimento na sua aprovação</Text>
            <Text style={styles.price}>
              {PREMIUM_PRICE}
              <Text style={{ fontSize: 14, fontWeight: '400' }}>/mês</Text>
            </Text>
          </View>
          <View style={styles.body}>
            <Check icon="checkmark-circle-outline" color={colors.primary}>
              Acesso 24/7 sem interrupções
            </Check>
            <Check icon="checkmark-circle-outline" color={colors.primary}>
              Estude nos 7 dias da semana
            </Check>
            <Check icon="checkmark-circle-outline" color={colors.primary}>
              Prioridade de velocidade na IA
            </Check>
            <Button title="Assinatura disponível em breve" onPress={onClose} disabled style={{ marginTop: 16 }} />
            <Text style={styles.note}>Estamos finalizando o pagamento seguro. Avisaremos você por e-mail.</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 420, alignSelf: 'center' },
  header: { backgroundColor: colors.dark, padding: 24, alignItems: 'center' },
  close: { position: 'absolute', top: 12, right: 12 },
  title: { color: colors.white, fontSize: 22, fontWeight: '700' },
  subtitle: { color: colors.borderStrong, fontSize: 14, marginTop: 2 },
  price: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: 12 },
  body: { padding: 24, gap: 12 },
  note: { color: colors.textSubtle, fontSize: 12, textAlign: 'center' },
});
