import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

// Dados iniciais mockados
const INITIAL_DATA = {
  pacientes: [
    { id: 1, nome: 'João Silva', telefone: '(11) 99999-1111', email: 'joao@email.com', convenio: 'Uniodonto', numero_convenio: '123456' },
    { id: 2, nome: 'Maria Santos', telefone: '(11) 99999-2222', email: 'maria@email.com', convenio: 'Particular', numero_convenio: '' },
    { id: 3, nome: 'Pedro Oliveira', telefone: '(11) 99999-3333', email: 'pedro@email.com', convenio: 'Amil Dental', numero_convenio: '789012' },
    { id: 4, nome: 'Ana Costa', telefone: '(11) 99999-4444', email: 'ana@email.com', convenio: 'Bradesco Dental', numero_convenio: '345678' },
    { id: 5, nome: 'Clara Mendes', telefone: '(11) 99999-5555', email: 'clara@email.com', convenio: 'Particular', numero_convenio: '' },
  ],
  
  procedimentos: [
    { id: 1, nome: 'Limpeza', valor: 150, duracao: 30, descricao: 'Limpeza e profilaxia' },
    { id: 2, nome: 'Canal', valor: 1000, duracao: 90, descricao: 'Tratamento de canal' },
    { id: 3, nome: 'Extração', valor: 300, duracao: 45, descricao: 'Extração dentária' },
    { id: 4, nome: 'Restauração', valor: 250, duracao: 30, descricao: 'Restauração com resina' },
    { id: 5, nome: 'Clareamento', valor: 500, duracao: 60, descricao: 'Clareamento dental' },
  ],
  
  planos: [
    { id: 1, nome: 'Uniodonto', cobertura: 80, tipo: 'percentual', empresa: 'Uniodonto' },
    { id: 2, nome: 'Amil Dental', cobertura: 70, tipo: 'percentual', empresa: 'Amil' },
    { id: 3, nome: 'Particular', cobertura: 0, tipo: 'percentual', empresa: '' },
    { id: 4, nome: 'Bradesco Dental', cobertura: 75, tipo: 'percentual', empresa: 'Bradesco' },
  ],
  
  dentistas: [
    { id: 1, nome: 'Dra. Ana Silva', especialidade: 'Ortodontia', cro: 'SP-12345' },
    { id: 2, nome: 'Dr. Carlos Souza', especialidade: 'Endodontia', cro: 'SP-12346' },
    { id: 3, nome: 'Dra. Patricia Lima', especialidade: 'Implantes', cro: 'SP-12347' },
  ],
  
  agendamentos: [],
  prontuarios: [],
  atendimentosPausados: [],
  imagens: [] // NOVO: Array para armazenar imagens/exames
};

export const DataProvider = ({ children }) => {
  // Carregar dados do localStorage ou usar dados iniciais
  const [pacientes, setPacientes] = useState(() => {
    const saved = localStorage.getItem('pacientes');
    return saved ? JSON.parse(saved) : INITIAL_DATA.pacientes;
  });
  
  const [procedimentos, setProcedimentos] = useState(() => {
    const saved = localStorage.getItem('procedimentos');
    return saved ? JSON.parse(saved) : INITIAL_DATA.procedimentos;
  });
  
  const [planos, setPlanos] = useState(() => {
    const saved = localStorage.getItem('planos');
    return saved ? JSON.parse(saved) : INITIAL_DATA.planos;
  });
  
  const [dentistas, setDentistas] = useState(() => {
    const saved = localStorage.getItem('dentistas');
    return saved ? JSON.parse(saved) : INITIAL_DATA.dentistas;
  });
  
  const [agendamentos, setAgendamentos] = useState(() => {
    const saved = localStorage.getItem('agendamentos');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [prontuarios, setProntuarios] = useState(() => {
    const saved = localStorage.getItem('prontuarios');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [atendimentosPausados, setAtendimentosPausados] = useState(() => {
    const saved = localStorage.getItem('atendimentosPausados');
    return saved ? JSON.parse(saved) : [];
  });
  
  // NOVO: Estado para imagens
  const [imagens, setImagens] = useState(() => {
    const saved = localStorage.getItem('imagens');
    return saved ? JSON.parse(saved) : [];
  });

  // Salvar no localStorage sempre que os dados mudarem
  useEffect(() => {
    localStorage.setItem('pacientes', JSON.stringify(pacientes));
  }, [pacientes]);
  
  useEffect(() => {
    localStorage.setItem('procedimentos', JSON.stringify(procedimentos));
  }, [procedimentos]);
  
  useEffect(() => {
    localStorage.setItem('planos', JSON.stringify(planos));
  }, [planos]);
  
  useEffect(() => {
    localStorage.setItem('dentistas', JSON.stringify(dentistas));
  }, [dentistas]);
  
  useEffect(() => {
    localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
  }, [agendamentos]);
  
  useEffect(() => {
    localStorage.setItem('prontuarios', JSON.stringify(prontuarios));
  }, [prontuarios]);
  
  useEffect(() => {
    localStorage.setItem('atendimentosPausados', JSON.stringify(atendimentosPausados));
  }, [atendimentosPausados]);
  
  // NOVO: Salvar imagens no localStorage
  useEffect(() => {
    localStorage.setItem('imagens', JSON.stringify(imagens));
  }, [imagens]);

  // Funções para gerenciar dados
  const adicionarPaciente = (paciente) => {
    setPacientes([...pacientes, paciente]);
  };
  
  const atualizarPaciente = (paciente) => {
    setPacientes(pacientes.map(p => p.id === paciente.id ? paciente : p));
  };
  
  const deletarPaciente = (id) => {
    setPacientes(pacientes.filter(p => p.id !== id));
  };
  
  const adicionarProcedimento = (procedimento) => {
    setProcedimentos([...procedimentos, procedimento]);
  };
  
  const atualizarProcedimento = (procedimento) => {
    setProcedimentos(procedimentos.map(p => p.id === procedimento.id ? procedimento : p));
  };
  
  const deletarProcedimento = (id) => {
    setProcedimentos(procedimentos.filter(p => p.id !== id));
  };
  
  const adicionarPlano = (plano) => {
    setPlanos([...planos, plano]);
  };
  
  const atualizarPlano = (plano) => {
    setPlanos(planos.map(p => p.id === plano.id ? plano : p));
  };
  
  const deletarPlano = (id) => {
    setPlanos(planos.filter(p => p.id !== id));
  };
  
  const adicionarAgendamento = (agendamento) => {
    const novoAgendamento = {
      ...agendamento,
      id: agendamento.id || Date.now(),
      created_at: new Date().toISOString()
    };
    setAgendamentos(prev => [novoAgendamento, ...prev]);
  };
  
  const atualizarAgendamento = (agendamentoAtualizado) => {
    setAgendamentos(prev => prev.map(ag => 
      ag.id === agendamentoAtualizado.id ? agendamentoAtualizado : ag
    ));
  };
  
  const adicionarProntuario = (prontuario) => {
    setProntuarios([...prontuarios, prontuario]);
  };
  
  const pausarAtendimento = (atendimento) => {
    setAtendimentosPausados([...atendimentosPausados, atendimento]);
  };
  
  const retomarAtendimento = (id) => {
    setAtendimentosPausados(atendimentosPausados.filter(a => a.id !== id));
  };
  
  // Função para buscar agendamentos por status
  const buscarAgendamentosPorStatus = (status) => {
    return agendamentos.filter(ag => ag.status === status);
  };
  
  // Função para buscar retornos pendentes (para notificações)
  const buscarRetornosPendentes = () => {
    return agendamentos.filter(ag => 
      ag.status === 'retorno_pendente' || ag.solicitar_retorno === true
    );
  };
  
  // NOVO: Funções para gerenciar imagens
  const adicionarImagem = (imagem) => {
    const novaImagem = {
      ...imagem,
      id: imagem.id || Date.now(),
      created_at: new Date().toISOString()
    };
    setImagens(prev => [novaImagem, ...prev]);
  };
  
  const atualizarImagem = (imagemAtualizada) => {
    setImagens(prev => prev.map(img => 
      img.id === imagemAtualizada.id ? imagemAtualizada : img
    ));
  };
  
  const deletarImagem = (id) => {
    setImagens(prev => prev.filter(img => img.id !== id));
  };
  
  // Função para buscar imagens por paciente
  const buscarImagensPorPaciente = (pacienteId) => {
    return imagens.filter(img => img.paciente_id === pacienteId);
  };

  return (
    <DataContext.Provider value={{
      // Pacientes
      pacientes,
      adicionarPaciente,
      atualizarPaciente,
      deletarPaciente,
      
      // Procedimentos
      procedimentos,
      adicionarProcedimento,
      atualizarProcedimento,
      deletarProcedimento,
      
      // Planos
      planos,
      adicionarPlano,
      atualizarPlano,
      deletarPlano,
      
      // Dentistas
      dentistas,
      
      // Agendamentos
      agendamentos,
      adicionarAgendamento,
      atualizarAgendamento,
      buscarAgendamentosPorStatus,
      buscarRetornosPendentes,
      
      // Prontuários
      prontuarios,
      adicionarProntuario,
      
      // Atendimentos Pausados
      atendimentosPausados,
      pausarAtendimento,
      retomarAtendimento,
      
      // NOVO: Imagens/Exames
      imagens,
      adicionarImagem,
      atualizarImagem,
      deletarImagem,
      buscarImagensPorPaciente,
    }}>
      {children}
    </DataContext.Provider>
  );
};