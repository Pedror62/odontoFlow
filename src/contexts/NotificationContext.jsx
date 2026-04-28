import React, { createContext, useContext, useState, useEffect } from 'react';
import { showToast } from '../components/Toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [alertasEstoque, setAlertasEstoque] = useState([]);
  const [lembretesRetorno, setLembretesRetorno] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [ultimaVerificacao, setUltimaVerificacao] = useState({ estoque: null, retorno: null });

  // Carregar notificações do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      setNotificacoesNaoLidas(parsed.filter(n => !n.lida).length);
    }
    
    const savedRetornos = localStorage.getItem('lembretesRetorno');
    if (savedRetornos) {
      setLembretesRetorno(JSON.parse(savedRetornos));
    }
  }, []);

  // Salvar notificações no localStorage
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    setNotificacoesNaoLidas(notifications.filter(n => !n.lida).length);
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('lembretesRetorno', JSON.stringify(lembretesRetorno));
  }, [lembretesRetorno]);

  // Adicionar nova notificação
  const adicionarNotificacao = (titulo, mensagem, tipo, dados = {}) => {
    const novaNotificacao = {
      id: Date.now(),
      titulo,
      mensagem,
      tipo,
      dados,
      data: new Date().toISOString(),
      lida: false
    };
    
    setNotifications([novaNotificacao, ...notifications]);
    
    // Mostrar toast temporário
    if (tipo === 'estoque') {
      showToast(`⚠️ ${titulo}`, 'error');
    } else if (tipo === 'retorno') {
      showToast(`📅 ${titulo}`, 'info');
    } else if (tipo === 'bemvindo') {
      showToast(`👋 ${titulo}`, 'success');
    } else {
      showToast(`🔔 ${titulo}`, 'success');
    }
    
    return novaNotificacao;
  };

  // Marcar notificação como lida
  const marcarComoLida = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, lida: true } : n
    ));
  };

  // Marcar todas como lidas
  const marcarTodasComoLidas = () => {
    setNotifications(notifications.map(n => ({ ...n, lida: true })));
  };

  // Remover notificação
  const removerNotificacao = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Limpar alertas atuais
  const limparAlertas = () => {
    setAlertasEstoque([]);
    setLembretesRetorno([]);
  };

  // Verificar estoque baixo (evitando duplicação)
  const verificarEstoqueBaixo = (materiais, distribuicaoSala) => {
    const agora = new Date().getTime();
    // Verificar apenas a cada 5 minutos para não repetir
    if (ultimaVerificacao.estoque && (agora - ultimaVerificacao.estoque) < 300000) {
      return alertasEstoque;
    }
    
    const alertas = [];
    const alertasSet = new Set(); // Para evitar duplicatas
    
    // Verificar estoque geral
    materiais.forEach(material => {
      if (material.estoque <= material.estoqueMinimo) {
        const key = `geral_${material.id}`;
        if (!alertasSet.has(key)) {
          alertasSet.add(key);
          alertas.push({
            tipo: 'geral',
            material: material.nome,
            estoque: material.estoque,
            minimo: material.estoqueMinimo
          });
        }
      }
    });
    
    // Verificar estoque por sala
    Object.keys(distribuicaoSala).forEach(sala => {
      distribuicaoSala[sala].forEach(item => {
        const material = materiais.find(m => m.id === item.materialId);
        if (material && item.quantidade < 10) {
          const key = `sala_${sala}_${item.materialId}`;
          if (!alertasSet.has(key)) {
            alertasSet.add(key);
            alertas.push({
              tipo: 'sala',
              sala,
              material: material.nome,
              quantidade: item.quantidade
            });
          }
        }
      });
    });
    
    setAlertasEstoque(alertas);
    setUltimaVerificacao(prev => ({ ...prev, estoque: agora }));
    
    // Criar apenas notificação no sino (sem toast duplicado)
    alertas.forEach(alerta => {
      const titulo = alerta.tipo === 'geral' 
        ? `Estoque baixo: ${alerta.material}`
        : `Estoque baixo na Sala ${alerta.sala}`;
      
      const mensagem = alerta.tipo === 'geral'
        ? `Restam apenas ${alerta.estoque} unidades`
        : `${alerta.material}: restam apenas ${alerta.quantidade} unidades`;
      
      // Verificar se já existe notificação similar recente
      const notificacaoExistente = notifications.find(n => 
        n.tipo === 'estoque' && 
        n.titulo === titulo &&
        (new Date().getTime() - new Date(n.data).getTime()) < 3600000 // 1 hora
      );
      
      if (!notificacaoExistente) {
        adicionarNotificacao(titulo, mensagem, 'estoque', alerta);
      }
    });
    
    return alertas;
  };

  // Verificar retornos pendentes
  const verificarRetornosPendentes = (agendamentos) => {
    const hoje = new Date();
    const retornos = [];
    const retornosSet = new Set();
    
    agendamentos.forEach(ag => {
      if (ag.status === 'retorno_agendado' && ag.data) {
        const dataRetorno = new Date(ag.data);
        const diffDias = Math.ceil((dataRetorno - hoje) / (1000 * 60 * 60 * 24));
        
        if (diffDias === 0 || diffDias === 1 || diffDias === 2) {
          const key = `${ag.paciente_nome}_${ag.data}`;
          if (!retornosSet.has(key)) {
            retornosSet.add(key);
            retornos.push({
              ...ag,
              urgente: diffDias === 0,
              mensagem: diffDias === 0 ? 'HOJE!' : diffDias === 1 ? 'Amanhã' : 'Em 2 dias'
            });
          }
        }
      }
    });
    
    setLembretesRetorno(retornos);
    
    // Criar notificações para retornos de hoje
    retornos.filter(r => r.urgente).forEach(retorno => {
      const titulo = `Retorno Hoje: ${retorno.paciente_nome}`;
      const notificacaoExistente = notifications.find(n => 
        n.tipo === 'retorno' && 
        n.titulo === titulo &&
        (new Date().getTime() - new Date(n.data).getTime()) < 86400000 // 24 horas
      );
      
      if (!notificacaoExistente) {
        adicionarNotificacao(
          titulo,
          `${retorno.procedimento_nome} às ${retorno.horario} - Sala ${retorno.sala}`,
          'retorno',
          retorno
        );
      }
    });
    
    return retornos;
  };

  // Notificação de boas-vindas
  const notificarBemVindo = (nome, role) => {
    const mensagem = `Bem-vindo ao sistema, ${nome}!`;
    adicionarNotificacao(mensagem, `Você está logado como ${role}`, 'bemvindo', { nome, role });
  };

  const value = {
    notifications,
    alertasEstoque,
    lembretesRetorno,
    notificacoesNaoLidas,
    adicionarNotificacao,
    marcarComoLida,
    marcarTodasComoLidas,
    removerNotificacao,
    verificarEstoqueBaixo,
    verificarRetornosPendentes,
    notificarBemVindo,
    limparAlertas
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};