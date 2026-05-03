import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CalendarPlus, Users, List, LogOut, Activity, 
  Bell, Search, UserPlus, Clock, CheckCircle, 
  XCircle, AlertCircle, Phone, Mail, MapPin,
  CreditCard, Stethoscope, Calendar, ChevronRight,
  Plus, Edit, Trash2, Save, X, Move, Maximize2,
  Filter, Eye, EyeOff, Grid, List as ListIcon, RefreshCw,
  Zap, Loader
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../Toast';
import CalendarioInterativo from '../agenda/CalendarioInterativo';

// Funções auxiliares para validação de horário
const horarioParaMinutos = (horario) => {
  const [hora, minuto] = horario.split(':').map(Number);
  return hora * 60 + minuto;
};

const minutosParaHorario = (minutos) => {
  const hora = Math.floor(minutos / 60);
  const minuto = minutos % 60;
  return `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
};

// Duração padrão por procedimento
const getDuracaoProcedimento = (procedimentoId, procedimentos) => {
  const proc = procedimentos?.find(p => p.id == procedimentoId);
  return proc?.duracao || 30;
};

// Verificar conflito de horário
const verificarConflitoHorario = (agendamentos, novoAgendamento, idIgnorar = null) => {
  const novoInicio = horarioParaMinutos(novoAgendamento.horario);
  const novaDuracao = getDuracaoProcedimento(novoAgendamento.procedimento_id, novoAgendamento.procedimentos);
  const novoFim = novoInicio + novaDuracao;
  
  for (const ag of agendamentos) {
    if (ag.id === idIgnorar) continue;
    if (ag.data !== novoAgendamento.data) continue;
    if (ag.sala !== novoAgendamento.sala) continue;
    if (ag.status === 'cancelado') continue;
    
    const agInicio = horarioParaMinutos(ag.horario);
    const agDuracao = getDuracaoProcedimento(ag.procedimento_id, novoAgendamento.procedimentos);
    const agFim = agInicio + agDuracao;
    
    if (novoInicio < agFim && novoFim > agInicio) {
      return { conflito: true, com: ag };
    }
  }
  return { conflito: false, com: null };
};

export default function SecretarioDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const {
    pacientes,
    adicionarPaciente,
    atualizarPaciente,
    deletarPaciente,
    procedimentos,
    dentistas,
    planos,
    agendamentos,
    adicionarAgendamento,
    atualizarAgendamento
  } = useData();
  
  const [activeTab, setActiveTab] = useState('agenda');
  const [showQuickPaciente, setShowQuickPaciente] = useState(false);
  const [showQuickAgendamento, setShowQuickAgendamento] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [pacienteEdit, setPacienteEdit] = useState(null);
  const [visualizacao, setVisualizacao] = useState('semanal');
  const [salaSelecionada, setSalaSelecionada] = useState('todas');
  const [dentistaSelecionado, setDentistaSelecionado] = useState('todos');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [sugestoesHorarios, setSugestoesHorarios] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  
  // Estado para cadastro rápido
  const [quickPaciente, setQuickPaciente] = useState({
    nome: '',
    telefone: '',
    email: '',
    convenio: 'Particular'
  });
  
  // Estado para agendamento rápido
  const [quickAgendamento, setQuickAgendamento] = useState({
    paciente_id: '',
    procedimento_id: '',
    dentista_id: '',
    data: new Date().toISOString().split('T')[0],
    horario: '',
    sala: '01'
  });

  // Verificar notificações de retorno pendente
  useEffect(() => {
    const retornosPendentes = agendamentos.filter(ag => 
      ag.status === 'retorno_pendente' && !ag.notificacao_vista
    );
    
    const novosRetornos = retornosPendentes.filter(
      ret => !notificacoes.some(n => n.id === ret.id)
    );
    
    if (novosRetornos.length > 0) {
      setNotificacoes(prev => [...novosRetornos, ...prev]);
      showToast(`${novosRetornos.length} novo(s) retorno(s) pendente(s)!`, 'info');
    }
  }, [agendamentos]);

  // Sincronização entre abas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'agendamentos') {
        setForceUpdate(prev => prev + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowQuickPaciente(false);
        setShowQuickAgendamento(false);
        setMostrarNotificacoes(false);
        setMostrarSugestoes(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Filtro de pacientes
  const pacientesFiltrados = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.telefone?.includes(searchTerm)
  );

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowQuickAgendamento(true);
      }
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        setShowQuickPaciente(true);
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setMostrarFiltros(!mostrarFiltros);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mostrarFiltros]);

  const handleLogout = () => {
    logout();
    showToast('Logout realizado com sucesso!', 'success');
    navigate('/login');
  };

  // Marcar notificação como lida
  const marcarNotificacaoComoLida = (id) => {
    const agToUpdate = agendamentos.find(ag => ag.id === id);
    if (agToUpdate) {
      atualizarAgendamento({ ...agToUpdate, notificacao_vista: true });
    }
    setNotificacoes(notificacoes.filter(n => n.id !== id));
    showToast('Abra o formulário para reagendar o retorno', 'info');
  };

  // ========== NOVA FUNÇÃO: Buscar horários disponíveis ==========
  const buscarHorariosDisponiveis = () => {
    if (!quickAgendamento.dentista_id || !quickAgendamento.procedimento_id) {
      showToast('Selecione dentista e procedimento primeiro', 'error');
      return;
    }
    
    if (!quickAgendamento.data) {
      showToast('Selecione uma data primeiro', 'error');
      return;
    }
    
    setCarregandoHorarios(true);
    
    setTimeout(() => {
      const duracao = getDuracaoProcedimento(quickAgendamento.procedimento_id, procedimentos);
      const inicioExpediente = 8 * 60; // 08:00
      const fimExpediente = 19 * 60; // 19:00
      const horariosDisponiveis = [];
      
      // Filtrar agendamentos do mesmo dentista e mesma data
      const agendamentosDentista = agendamentos.filter(ag => 
        ag.dentista_id == quickAgendamento.dentista_id && 
        ag.data === quickAgendamento.data &&
        ag.status !== 'cancelado'
      );
      
      // Verificar horários de 30 em 30 minutos
      for (let minutos = inicioExpediente; minutos + duracao <= fimExpediente; minutos += 30) {
        const horario = minutosParaHorario(minutos);
        const inicio = minutos;
        const fim = inicio + duracao;
        
        let conflito = false;
        for (const ag of agendamentosDentista) {
          const agDuracao = getDuracaoProcedimento(ag.procedimento_id, procedimentos);
          const agInicio = horarioParaMinutos(ag.horario);
          const agFim = agInicio + agDuracao;
          
          if (inicio < agFim && fim > agInicio) {
            conflito = true;
            break;
          }
        }
        
        if (!conflito) {
          horariosDisponiveis.push(horario);
        }
      }
      
      setSugestoesHorarios(horariosDisponiveis);
      setMostrarSugestoes(horariosDisponiveis.length > 0);
      setCarregandoHorarios(false);
      
      if (horariosDisponiveis.length === 0) {
        showToast('Não há horários disponíveis nesta data. Tente outra data.', 'warning');
      } else {
        showToast(`Encontrados ${horariosDisponiveis.length} horários disponíveis!`, 'success');
      }
    }, 300);
  };

  // Aplicar horário sugerido
  const aplicarHorarioSugerido = (horario) => {
    setQuickAgendamento({ ...quickAgendamento, horario });
    setMostrarSugestoes(false);
    showToast(`Horário ${horario} selecionado!`, 'success');
  };

  // Cadastro rápido de paciente
  const handleQuickSavePaciente = () => {
    if (!quickPaciente.nome.trim()) {
      showToast('Nome do paciente é obrigatório', 'error');
      return;
    }
    
    const novoPaciente = {
      id: Date.now(),
      ...quickPaciente,
      created_at: new Date().toISOString()
    };
    
    adicionarPaciente(novoPaciente);
    showToast(`Paciente ${quickPaciente.nome} cadastrado com sucesso!`, 'success');
    
    setQuickPaciente({ nome: '', telefone: '', email: '', convenio: 'Particular' });
    setShowQuickPaciente(false);
    
    if (showQuickAgendamento) {
      setQuickAgendamento({ ...quickAgendamento, paciente_id: novoPaciente.id });
      setPacienteSelecionado(novoPaciente);
    }
  };

  // ========== AGENDAMENTO RÁPIDO COM VALIDAÇÃO ==========
  const handleQuickAgendamento = () => {
    // Validação de campos obrigatórios
    if (!quickAgendamento.paciente_id || !quickAgendamento.procedimento_id || !quickAgendamento.dentista_id) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    if (!quickAgendamento.horario) {
      showToast('Selecione um horário (use o botão "Buscar horários")', 'error');
      return;
    }
    
    // VALIDAÇÃO DE CONFLITO DE HORÁRIO
    const novoAgendamento = {
      paciente_id: quickAgendamento.paciente_id,
      procedimento_id: quickAgendamento.procedimento_id,
      dentista_id: quickAgendamento.dentista_id,
      sala: quickAgendamento.sala,
      data: quickAgendamento.data,
      horario: quickAgendamento.horario,
      procedimentos: procedimentos
    };
    
    const { conflito, com } = verificarConflitoHorario(agendamentos, novoAgendamento);
    
    if (conflito) {
      const duracao = getDuracaoProcedimento(quickAgendamento.procedimento_id, procedimentos);
      const fim = minutosParaHorario(horarioParaMinutos(quickAgendamento.horario) + duracao);
      showToast(`⚠️ Conflito: Sala ${quickAgendamento.sala} já ocupada por ${com?.paciente_nome} (${com?.horario} - ${fim})`, 'error');
      return;
    }
    
    const paciente = pacientes.find(p => p.id == quickAgendamento.paciente_id);
    const procedimento = procedimentos.find(p => p.id == quickAgendamento.procedimento_id);
    const dentista = dentistas.find(d => d.id == quickAgendamento.dentista_id);
    const plano = planos.find(p => p.id === 3);
    
    const valorComDesconto = procedimento?.valor || 0;
    const duracao = procedimento?.duracao || 30;
    
    const novoAgendamentoObj = {
      id: Date.now(),
      paciente_id: quickAgendamento.paciente_id,
      paciente_nome: paciente?.nome,
      procedimento_id: quickAgendamento.procedimento_id,
      procedimento_nome: procedimento?.nome,
      dentista_id: quickAgendamento.dentista_id,
      dentista_nome: dentista?.nome,
      plano_id: 3,
      plano_nome: 'Particular',
      sala: quickAgendamento.sala,
      data: quickAgendamento.data,
      horario: quickAgendamento.horario,
      valor_final: valorComDesconto,
      valor_original: procedimento?.valor,
      duracao: duracao,
      status: 'agendado',
      created_at: new Date().toISOString()
    };
    
    adicionarAgendamento(novoAgendamentoObj);
    showToast(`✅ Agendamento para ${paciente?.nome} realizado com sucesso!`, 'success');
    
    // Limpar formulário
    setQuickAgendamento({
      paciente_id: '',
      procedimento_id: '',
      dentista_id: '',
      data: new Date().toISOString().split('T')[0],
      horario: '',
      sala: '01'
    });
    setPacienteSelecionado(null);
    setMostrarSugestoes(false);
    setShowQuickAgendamento(false);
    setForceUpdate(prev => prev + 1);
  };

  // Função para mover agendamento (drag & drop)
  const handleAgendamentoMove = (agendamentoAtualizado) => {
    atualizarAgendamento(agendamentoAtualizado);
    showToast(`Agendamento remarcado com sucesso!`, 'success');
    setForceUpdate(prev => prev + 1);
  };

  // Função para editar agendamento
  const handleAgendamentoClick = (agendamento) => {
    console.log('Agendamento selecionado:', agendamento);
    setQuickAgendamento({
      paciente_id: agendamento.paciente_id,
      procedimento_id: agendamento.procedimento_id,
      dentista_id: agendamento.dentista_id,
      data: agendamento.data,
      horario: agendamento.horario,
      sala: agendamento.sala
    });
    setShowQuickAgendamento(true);
  };

  // Limpar filtros
  const limparFiltros = () => {
    setSalaSelecionada('todas');
    setDentistaSelecionado('todos');
    setSearchTerm('');
    showToast('Filtros limpos!', 'success');
  };

  // Próximos atendimentos
  const agora = new Date();
  const horaAtualNum = agora.getHours();
  const hojeStr = new Date().toISOString().split('T')[0];
  const proximosAtendimentos = agendamentos
    .filter(ag => {
      if (!ag.horario || ag.status === 'cancelado' || ag.status === 'concluido') return false;
      const horaAg = parseInt(ag.horario.split(':')[0]);
      return ag.data === hojeStr && horaAg >= horaAtualNum && horaAg <= horaAtualNum + 4;
    })
    .slice(0, 5);

  const stats = {
    totalPacientes: pacientes.length,
    totalAgendamentos: agendamentos.length,
    agendamentosHoje: agendamentos.filter(ag => ag.data === hojeStr && ag.status !== 'cancelado').length,
    atrasados: agendamentos.filter(ag => {
      if (!ag.horario || ag.status === 'cancelado' || ag.status === 'concluido') return false;
      const horaAg = parseInt(ag.horario.split(':')[0]);
      return ag.data === hojeStr && horaAg < horaAtualNum;
    }).length
  };

  const salas = salaSelecionada === 'todas' ? ['01', '02', '03'] : [salaSelecionada];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Activity size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">OdontoFlow</h1>
                <p className="text-[10px] text-gray-500">Secretaria • {user?.nome}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Notificações */}
              <div className="relative">
                <button
                  onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
                  className="p-2 rounded-full hover:bg-gray-100 transition relative"
                  title="Notificações de retorno"
                >
                  <Bell size={18} />
                  {notificacoes.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                      {notificacoes.length}
                    </span>
                  )}
                </button>
                
                {mostrarNotificacoes && notificacoes.length > 0 && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
                    <div className="p-3 border-b bg-orange-50">
                      <h4 className="font-semibold text-sm">🔄 Retornos Pendentes</h4>
                      <p className="text-[10px] text-gray-500">Clique em um retorno para agendar</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notificacoes.map(notif => (
                        <div key={notif.id} className="p-3 border-b hover:bg-gray-50 transition cursor-pointer" onClick={() => marcarNotificacaoComoLida(notif.id)}>
                          <p className="text-sm font-medium">{notif.paciente_nome}</p>
                          <p className="text-xs text-gray-500">{notif.procedimento_nome}</p>
                          <button className="text-xs text-blue-600 mt-1 hover:underline">Agendar retorno →</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`p-2 rounded-full transition ${mostrarFiltros ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="Filtros (Ctrl+F)"
              >
                <Filter size={18} />
              </button>
              
              <button
                onClick={() => setShowQuickAgendamento(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                title="Ctrl + N"
              >
                <CalendarPlus size={14} /> Agendar
              </button>
              
              <button
                onClick={() => setShowQuickPaciente(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                title="Ctrl + P"
              >
                <UserPlus size={14} /> Paciente
              </button>
              
              <button onClick={handleLogout} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="bg-white border-b shadow-sm sticky top-[57px] z-20">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-gray-500">Filtros:</span>
            <select value={salaSelecionada} onChange={(e) => setSalaSelecionada(e.target.value)} className="px-2 py-1 text-xs border rounded-lg">
              <option value="todas">Todas salas</option>
              {['01', '02', '03'].map(s => <option key={s} value={s}>Sala {s}</option>)}
            </select>
            <select value={dentistaSelecionado} onChange={(e) => setDentistaSelecionado(e.target.value)} className="px-2 py-1 text-xs border rounded-lg">
              <option value="todos">Todos dentistas</option>
              {dentistas.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
            </select>
            <button onClick={limparFiltros} className="text-xs text-red-500 hover:text-red-600">Limpar filtros</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-blue-500">
            <p className="text-[10px] text-gray-400">Pacientes</p>
            <p className="text-xl font-bold">{stats.totalPacientes}</p>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-green-500">
            <p className="text-[10px] text-gray-400">Agendamentos</p>
            <p className="text-xl font-bold">{stats.totalAgendamentos}</p>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-yellow-500">
            <p className="text-[10px] text-gray-400">Hoje</p>
            <p className="text-xl font-bold">{stats.agendamentosHoje}</p>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-purple-500">
            <p className="text-[10px] text-gray-400">Atrasados</p>
            <p className="text-xl font-bold text-red-600">{stats.atrasados}</p>
          </div>
        </div>
      </div>

      {/* Próximos atendimentos */}
      {proximosAtendimentos.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={12} className="text-gray-400" />
            <span className="text-[10px] text-gray-500">Próximos atendimentos</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {proximosAtendimentos.map(ag => (
              <div key={ag.id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5 min-w-[180px] border border-blue-100">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {ag.paciente_nome?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium truncate">{ag.paciente_nome}</p>
                  <div className="flex gap-2">
                    <p className="text-[10px] text-gray-500">{ag.horario}</p>
                    <p className="text-[10px] text-gray-400">Sala {ag.sala}</p>
                  </div>
                </div>
                <button onClick={() => handleAgendamentoClick(ag)} className="text-[10px] text-blue-600 hover:underline">Editar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="max-w-7xl mx-auto px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Buscar paciente por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Calendário */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button onClick={() => setVisualizacao('semanal')} className={`px-3 py-1 text-xs rounded-lg transition ${visualizacao === 'semanal' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Semana</button>
                <button onClick={() => setVisualizacao('diaria')} className={`px-3 py-1 text-xs rounded-lg transition ${visualizacao === 'diaria' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Dia</button>
              </div>
              <button onClick={() => window.location.reload()} className="p-1 text-gray-400 hover:text-gray-600 transition" title="Atualizar">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="text-[10px] text-gray-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          
          <CalendarioInterativo
            key={forceUpdate}
            agendamentos={agendamentos}
            dentistas={dentistas}
            procedimentos={procedimentos}
            salas={salas}
            visualizacao={visualizacao}
            onAgendamentoClick={handleAgendamentoClick}
            onAgendamentoMove={handleAgendamentoMove}
          />
        </div>
      </div>

      {/* Modal de Agendamento Rápido com Busca de Horários */}
      {showQuickAgendamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="text-blue-600" size={20} />
                  <h2 className="text-lg font-bold">Agendamento Rápido</h2>
                </div>
                <button onClick={() => setShowQuickAgendamento(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-[10px] text-gray-500">Preencha os dados da consulta</p>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Seleção de Paciente */}
              <div>
                <label className="block text-xs font-medium mb-1">Paciente *</label>
                <div className="flex gap-2">
                  <select
                    value={quickAgendamento.paciente_id}
                    onChange={(e) => {
                      setQuickAgendamento({...quickAgendamento, paciente_id: e.target.value});
                      const p = pacientes.find(p => p.id == e.target.value);
                      setPacienteSelecionado(p);
                    }}
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  <button onClick={() => { setShowQuickAgendamento(false); setShowQuickPaciente(true); }} className="px-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm">
                    <UserPlus size={16} />
                  </button>
                </div>
                {pacienteSelecionado && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    📞 {pacienteSelecionado.telefone || 'Sem telefone'} • 🏥 {pacienteSelecionado.convenio || 'Particular'}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Procedimento *</label>
                  <select
                    value={quickAgendamento.procedimento_id}
                    onChange={(e) => setQuickAgendamento({...quickAgendamento, procedimento_id: e.target.value})}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {procedimentos.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.duracao || 30}min)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Dentista *</label>
                  <select
                    value={quickAgendamento.dentista_id}
                    onChange={(e) => setQuickAgendamento({...quickAgendamento, dentista_id: e.target.value})}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {dentistas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Data *</label>
                  <input
                    type="date"
                    value={quickAgendamento.data}
                    onChange={(e) => setQuickAgendamento({...quickAgendamento, data: e.target.value})}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Sala</label>
                  <select
                    value={quickAgendamento.sala}
                    onChange={(e) => setQuickAgendamento({...quickAgendamento, sala: e.target.value})}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>01</option>
                    <option>02</option>
                    <option>03</option>
                  </select>
                </div>
              </div>
              
              {/* Horário com Busca Inteligente */}
              <div>
                <label className="block text-xs font-medium mb-1">Horário *</label>
                <div className="flex gap-2">
                  <select
                    value={quickAgendamento.horario}
                    onChange={(e) => setQuickAgendamento({...quickAgendamento, horario: e.target.value})}
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={carregandoHorarios}
                  >
                    <option value="">Selecione ou busque</option>
                    {sugestoesHorarios.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={buscarHorariosDisponiveis}
                    disabled={carregandoHorarios || !quickAgendamento.dentista_id || !quickAgendamento.procedimento_id || !quickAgendamento.data}
                    className="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-1 text-sm disabled:opacity-50"
                  >
                    {carregandoHorarios ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
                    Buscar
                  </button>
                </div>
                {mostrarSugestoes && sugestoesHorarios.length > 0 && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg">
                    <p className="text-[10px] text-green-700 mb-1">✅ {sugestoesHorarios.length} horários disponíveis</p>
                    <div className="flex flex-wrap gap-1">
                      {sugestoesHorarios.slice(0, 5).map(h => (
                        <button key={h} onClick={() => aplicarHorarioSugerido(h)} className="text-[10px] bg-white border border-green-300 px-2 py-0.5 rounded hover:bg-green-100">
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button onClick={handleQuickAgendamento} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition text-sm">
                Confirmar
              </button>
              <button onClick={() => setShowQuickAgendamento(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro Rápido */}
      {showQuickPaciente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-green-50 to-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserPlus className="text-green-600" size={20} />
                  <h2 className="text-lg font-bold">Cadastro Rápido</h2>
                </div>
                <button onClick={() => setShowQuickPaciente(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <input type="text" placeholder="Nome completo *" value={quickPaciente.nome} onChange={(e) => setQuickPaciente({...quickPaciente, nome: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" />
              <input type="tel" placeholder="Telefone" value={quickPaciente.telefone} onChange={(e) => setQuickPaciente({...quickPaciente, telefone: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" />
              <select value={quickPaciente.convenio} onChange={(e) => setQuickPaciente({...quickPaciente, convenio: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg">
                <option>Particular</option>
                <option>Uniodonto</option>
                <option>Amil Dental</option>
                <option>Bradesco Dental</option>
              </select>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button onClick={handleQuickSavePaciente} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium text-sm">Salvar</button>
              <button onClick={() => setShowQuickPaciente(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Popover de resultados de busca */}
      {searchTerm && pacientesFiltrados.length > 0 && !showQuickAgendamento && (
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-xl shadow-2xl border z-40 overflow-hidden">
          <div className="p-2 bg-blue-50 border-b flex justify-between">
            <span className="text-xs font-medium">📋 Pacientes ({pacientesFiltrados.length})</span>
            <button onClick={() => setSearchTerm('')} className="text-gray-400"><X size={14} /></button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {pacientesFiltrados.slice(0, 5).map(p => (
              <div key={p.id} onClick={() => { setPacienteSelecionado(p); setShowQuickAgendamento(true); setQuickAgendamento({...quickAgendamento, paciente_id: p.id}); setSearchTerm(''); }} className="p-2 hover:bg-blue-50 cursor-pointer">
                <p className="text-sm font-medium">{p.nome}</p>
                <p className="text-[10px] text-gray-500">{p.telefone || 'Sem telefone'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
