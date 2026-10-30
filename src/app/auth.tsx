import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Logo } from '@/components/ui';
import { auth } from '@/lib/firebase';
import { colors } from '@/lib/theme';

// Esta tela não existia no protótipo HTML: o script procurava #view-auth e quebrava ao carregar
function authErrorMessage(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/invalid-email':
      return 'Digite um e-mail válido.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
}

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [isLogin, setIsLogin] = useState(params.mode !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      // O perfil (users/{uid}) é criado pelo SessionProvider assim que o login acontece
      if (isLogin) await signInWithEmailAndPassword(auth, email.trim(), password);
      else await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Digite seu e-mail para receber o link de redefinição.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.');
    } catch (e) {
      setError(authErrorMessage(e));
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center}>
        <View style={styles.card}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12}>
            <Logo />
          </Pressable>
          <Text style={styles.title}>{isLogin ? 'Acesse sua conta' : 'Crie sua conta'}</Text>

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha (mínimo 6 caracteres)"
            placeholderTextColor={colors.textSubtle}
            secureTextEntry
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {info && <Text style={styles.info}>{info}</Text>}

          <Button title={isLogin ? 'Entrar' : 'Cadastrar'} onPress={submit} loading={loading} />

          {isLogin && (
            <Pressable onPress={resetPassword}>
              <Text style={styles.link}>Esqueci minha senha</Text>
            </Pressable>
          )}

          <View style={styles.toggle}>
            <Text style={styles.toggleText}>{isLogin ? 'Não tem uma conta?' : 'Já possui conta?'}</Text>
            <Pressable
              onPress={() => {
                setIsLogin(!isLogin);
                setError(null);
                setInfo(null);
              }}>
              <Text style={styles.link}>{isLogin ? 'Cadastre-se' : 'Fazer login'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.dark, marginVertical: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  error: { color: colors.red, fontSize: 14 },
  info: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 14, textAlign: 'center' },
  toggle: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  toggleText: { color: colors.textMuted, fontSize: 14 },
});
