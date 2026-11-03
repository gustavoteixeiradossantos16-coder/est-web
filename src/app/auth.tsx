// Login e cadastro. Depois de entrar, a pessoa vai direto para o plano de estudos.
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Icon, Screen } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { useToast } from '@/context/ToastContext';
import { auth } from '@/lib/firebase';
import { colors, radius, TOUCH } from '@/lib/theme';

function mensagemDeErro(code: string) {
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found')
    return 'E-mail ou senha incorretos.';
  if (code === 'auth/email-already-in-use') return 'Este e-mail já está cadastrado.';
  if (code === 'auth/weak-password') return 'A senha deve ter pelo menos 6 caracteres.';
  if (code === 'auth/invalid-email') return 'Digite um e-mail válido.';
  if (code === 'auth/too-many-requests') return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  if (code === 'auth/network-request-failed') return 'Sem conexão. Verifique sua internet.';
  return 'Ocorreu um erro. Tente novamente.';
}

export default function Auth() {
  const { user } = useSession();
  const params = useLocalSearchParams<{ modo?: string }>();
  const toast = useToast();
  const [login, setLogin] = useState(params.modo !== 'cadastro');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  if (user && !enviando) return <Redirect href="/plano" />;

  async function enviar() {
    if (enviando) return; // evita duplo clique
    setErro('');
    setEnviando(true);
    const e = email.trim();
    try {
      if (login) {
        await signInWithEmailAndPassword(auth, e, senha);
      } else {
        try {
          await createUserWithEmailAndPassword(auth, e, senha);
          toast('Conta criada com sucesso!', 'success');
        } catch (err) {
          // A conta já existe (ex.: cadastro feito num clique anterior): tenta entrar com a mesma senha
          if ((err as { code?: string }).code !== 'auth/email-already-in-use') throw err;
          try {
            await signInWithEmailAndPassword(auth, e, senha);
          } catch {
            throw err;
          }
          toast('Você já tinha uma conta — entrando…', 'success');
        }
      }
      // O perfil é criado pela API no primeiro acesso a /me
      router.replace('/plano');
    } catch (err) {
      setErro(mensagemDeErro((err as { code?: string }).code ?? ''));
      setEnviando(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityRole="button" style={styles.voltar}>
          <Icon name="arrow-back" size={18} />
          <Text style={styles.voltarText}>Voltar</Text>
        </Pressable>

        <Card style={styles.card}>
          <View style={styles.icone}>
            <Icon name="school-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.titulo} role="heading">{login ? 'Acesse sua conta' : 'Crie sua conta'}</Text>
          <Text style={styles.sub}>
            {login ? 'Continue de onde parou no seu plano de estudos.' : 'Grátis. Em 1 minuto você tem seu plano de estudos.'}
          </Text>

          <Text style={styles.label} nativeID="lbl-email">E-mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            aria-labelledby="lbl-email"
            style={styles.input}
            returnKeyType="next"
          />
          <Text style={styles.label} nativeID="lbl-senha">Senha</Text>
          <TextInput
            value={senha}
            onChangeText={setSenha}
            placeholder="Mínimo de 6 caracteres"
            placeholderTextColor={colors.textSubtle}
            secureTextEntry
            autoComplete={login ? 'current-password' : 'new-password'}
            textContentType={login ? 'password' : 'newPassword'}
            aria-labelledby="lbl-senha"
            style={styles.input}
            onSubmitEditing={enviar}
            returnKeyType="go"
          />

          {erro ? (
            <View style={styles.erro} role="alert">
              <Icon name="alert-circle" size={18} color={colors.red} />
              <Text style={styles.erroText}>{erro}</Text>
            </View>
          ) : null}

          <Button
            label={enviando ? 'Entrando…' : login ? 'Entrar' : 'Cadastrar'}
            onPress={enviar}
            loading={enviando}
            disabled={!email.trim() || senha.length < 1}
            style={{ marginTop: 18 }}
          />

          <View style={styles.trocar}>
            <Text style={styles.sub}>{login ? 'Não tem uma conta?' : 'Já possui conta?'}</Text>
            <Pressable
              onPress={() => {
                setLogin(!login);
                setErro('');
              }}
              accessibilityRole="button"
              style={styles.trocarBtn}
            >
              <Text style={styles.trocarText}>{login ? 'Cadastre-se' : 'Fazer login'}</Text>
            </Pressable>
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: TOUCH, alignSelf: 'flex-start', marginTop: 8 },
  voltarText: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  card: { maxWidth: 440, width: '100%', alignSelf: 'center', marginTop: 16, padding: 24 },
  icone: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  titulo: { fontSize: 24, fontWeight: '800', color: colors.dark, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 18, marginBottom: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16, // 16px evita o zoom automático do iPhone
    color: colors.text,
    backgroundColor: colors.white,
  },
  erro: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 10, borderRadius: radius.sm, backgroundColor: colors.redSoft },
  erroText: { flex: 1, color: colors.redText, fontSize: 14 },
  trocar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: 16 },
  trocarBtn: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 6 },
  trocarText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
