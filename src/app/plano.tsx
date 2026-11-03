// Tela do plano de estudos: assistente (sem plano) → gerando → plano pronto
import { Redirect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { AdModal, UpgradeModal } from '@/components/Modals';
import { Gerando } from '@/components/plano/Gerando';
import { PlanoView } from '@/components/plano/PlanoView';
import { escolhasIniciais, Wizard, type Escolhas } from '@/components/plano/Wizard';
import { Button, Loading, Muted, Screen } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { useToast } from '@/context/ToastContext';
import { api, ApiError } from '@/lib/api';
import { nomeConcurso, progressoSemana } from '@/lib/plan';
import type { Plano } from '@/lib/types';

type Estado = { tipo: 'carregando' } | { tipo: 'erro'; msg: string } | { tipo: 'wizard' } | { tipo: 'gerando'; concurso: string } | { tipo: 'plano' };

export default function PlanoScreen() {
  const { carregando, user, perfil, erroPerfil, recarregarPerfil } = useSession();
  const toast = useToast();
  const [plano, setPlano] = useState<Plano | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [upgrade, setUpgrade] = useState(false);
  const [anuncio, setAnuncio] = useState(false);
  const gerando = useRef(false);

  const carregar = useCallback(async () => {
    setEstado({ tipo: 'carregando' });
    try {
      const p = await api.plano();
      setPlano(p);
      setEstado({ tipo: p ? 'plano' : 'wizard' });
    } catch (e) {
      setEstado({ tipo: 'erro', msg: e instanceof Error ? e.message : 'Não foi possível carregar seu plano.' });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let ativo = true;
    api
      .plano()
      .then((p) => {
        if (!ativo) return;
        setPlano(p);
        setEstado({ tipo: p ? 'plano' : 'wizard' });
      })
      .catch((e) => ativo && setEstado({ tipo: 'erro', msg: e instanceof Error ? e.message : 'Não foi possível carregar seu plano.' }));
    return () => {
      ativo = false;
    };
  }, [user]);

  if (carregando) return <Loading texto="Carregando sua conta…" />;
  if (!user) return <Redirect href="/" />;

  async function gerar(sel: Escolhas) {
    if (gerando.current) return; // ignora toques repetidos
    gerando.current = true;
    const concurso = nomeConcurso(sel.concursoId, sel.outro);
    setEstado({ tipo: 'gerando', concurso });
    try {
      const p = await api.gerarPlano({ concursoId: sel.concursoId, concurso, cargo: sel.cargo.trim(), dias: sel.dias, minutos: sel.minutos });
      setPlano(p);
      setEstado({ tipo: 'plano' });
      toast('Seu plano de estudos está pronto!', 'success');
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Não foi possível gerar o plano.', 'error');
      setEstado({ tipo: 'wizard' });
    } finally {
      gerando.current = false;
    }
  }

  async function marcar(chave: string, feito: boolean) {
    if (!plano) return;
    // Atualiza na hora e confirma no servidor (desfaz se der erro)
    const anterior = plano;
    const novo = { ...plano, progresso: { ...plano.progresso, itens: { ...plano.progresso.itens, [chave]: feito } } };
    setPlano(novo);
    const pr = progressoSemana(novo);
    if (feito && pr.feitos === pr.total) toast('Semana concluída! Excelente trabalho!', 'success');
    try {
      await api.marcarProgresso(chave, feito);
    } catch (e) {
      setPlano(anterior);
      toast(e instanceof Error ? e.message : 'Não foi possível salvar.', 'error');
    }
  }

  const header = <AppHeader atual="plano" onUpgrade={() => setUpgrade(true)} />;

  let conteudo;
  if (!perfil) {
    conteudo = erroPerfil ? (
      <Falha msg={erroPerfil} onTentar={recarregarPerfil} />
    ) : (
      <Loading texto="Carregando sua conta…" />
    );
  } else if (estado.tipo === 'carregando') {
    conteudo = <Loading texto="Carregando seu plano…" />;
  } else if (estado.tipo === 'erro') {
    conteudo = <Falha msg={estado.msg} onTentar={carregar} />;
  } else if (estado.tipo === 'gerando') {
    conteudo = <Gerando concurso={estado.concurso} />;
  } else if (estado.tipo === 'wizard' || !plano) {
    conteudo = (
      <Wizard
        perfil={perfil}
        inicial={escolhasIniciais(perfil, plano)}
        podeCancelar={!!plano}
        onCancelar={() => setEstado({ tipo: 'plano' })}
        onGerar={gerar}
        onUpgrade={() => setUpgrade(true)}
        onAnuncio={() => setAnuncio(true)}
      />
    );
  } else {
    conteudo = (
      <PlanoView
        plano={plano}
        perfil={perfil}
        onEditar={() => setEstado({ tipo: 'wizard' })}
        onMarcar={marcar}
        onUpgrade={() => setUpgrade(true)}
        onAnuncio={() => setAnuncio(true)}
      />
    );
  }

  return (
    <Screen header={header}>
      {conteudo}
      <UpgradeModal visible={upgrade} onClose={() => setUpgrade(false)} />
      <AdModal visible={anuncio} onClose={() => setAnuncio(false)} />
    </Screen>
  );
}

function Falha({ msg, onTentar }: { msg: string; onTentar: () => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 12, paddingVertical: 64 }}>
      <Muted style={{ textAlign: 'center' }}>{msg}</Muted>
      <Button label="Tentar de novo" icon="refresh" variant="outline" onPress={onTentar} />
    </View>
  );
}
