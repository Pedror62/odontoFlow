import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CalendarPlus, Users, List, LogOut, Activity, 
  Bell, Search, UserPlus, Clock, CheckCircle, 
  XCircle, AlertCircle, Phone, Mail, MapPin,
  CreditCard, Stethoscope, Calendar, ChevronRight,
  Plus, Edit, Trash2, Save, X, Move, Maximize2,
  Filter, Eye, EyeOff, Grid, List as ListIcon, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../Toast';
import CalendarioInterativo from '../agenda/CalendarioInterativo';

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
    horario: '09:00',
    sala: '01'
  });

  // CORREÇÃO 1: Verificar notificações de retorno pendente com atualização automática
  useEffect(() => {
    const retornosPendentes = agendamentos.filter(ag => 
      ag.status === 'retorno_pendente' && !ag.notificacao_vista
    );
    
    // Verificar se há novos retornos que não estão nas notificações atuais
    const novosRetornos = retornosPendentes.filter(
      ret => !notificacoes.some(n => n.id === ret.id)
    );
    
    if (novosRetornos.length > 0) {
      setNotificacoes(prev => [...novosRetornos, ...prev]);
      showToast(`${novosRetornos.length} novo(s) retorno(s) pendente(s)!`, 'info');
    }
  }, [agendamentos]);

  // CORREÇÃO 2: Sincronização entre abas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'agendamentos') {
        setForceUpdate(prev => prev + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // CORREÇÃO 3: Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowQuickPaciente(false);
        setShowQuickAgendamento(false);
        setMostrarNotificacoes(false);
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

  // Agendamento rápido
  const handleQuickAgendamento = () => {
    if (!quickAgendamento.paciente_id || !quickAgendamento.procedimento_id || !quickAgendamento.dentista_id) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    const paciente = pacientes.find(p => p.id == quickAgendamento.paciente_id);
    const procedimento = procedimentos.find(p => p.id == quickAgendamento.procedimento_id);
    const dentista = dentistas.find(d => d.id == quickAgendamento.dentista_id);
    
    const valorComDesconto = procedimento?.valor || 0;
    
    const novoAgendamento = {
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
      status: 'agendado',
      created_at: new Date().toISOString()
    };
    
    adicionarAgendamento(novoAgendamento);
    showToast(`Agendamento para ${paciente?.nome} realizado com sucesso!`, 'success');
    setShowQuickAgendamento(false);
    
    setQuickAgendamento({
      paciente_id: '',
      procedimento_id: '',
      dentista_id: '',
      data: new Date().toISOString().split('T')[0],
      horario: '09:00',
      sala: '01'
    });
    setPacienteSelecionado(null);
  };

  // Função para mover agendamento (drag & drop)
  const handleAgendamentoMove = (agendamentoAtualizado) => {
    atualizarAgendamento(agendamentoAtualizado);
    showToast(`Agendamento remarcado com sucesso!`, 'success');
    // Forçar atualização da UI
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

  // Salas para o calendário
  const salas = salaSelecionada === 'todas' ? ['01', '02', '03'] : [salaSelecionada];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simplificado */}
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
              {/* Botão Notificações com badge */}
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
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b bg-orange-50">
                      <h4 className="font-semibold text-sm">🔄 Retornos Pendentes</h4>
                      <p className="text-[10px] text-gray-500">Clique em um retorno para agendar</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notificacoes.map(notif => (
                        <div key={notif.id} className="p-3 border-b hover:bg-gray-50 transition cursor-pointer" onClick={() => marcarNotificacaoComoLida(notif.id)}>
                          <p className="text-sm font-medium">{notif.paciente_nome}</p>
                          <p className="text-xs text-gray-500">{notif.procedimento_nome}</p>
                          {notif.observacao_dentista && (
                            <p className="text-[10px] text-gray-400 italic mt-1">"{notif.observacao_dentista}"</p>
                          )}
                          <button className="text-xs text-blue-600 mt-1 hover:underline">
                            Agendar retorno →
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t bg-gray-50 text-center">
                      <button onClick={() => setMostrarNotificacoes(false)} className="text-[10px] text-gray-400">Fechar</button>
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
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros (colapsável) */}
      {mostrarFiltros && (
        <div className="bg-white border-b shadow-sm sticky top-[57px] z-20 animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-gray-500">Filtros:</span>
            <select
              value={salaSelecionada}
              onChange={(e) => setSalaSelecionada(e.target.value)}
              className="px-2 py-1 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas salas</option>
              {['01', '02', '03'].map(s => <option key={s} value={s}>Sala {s}</option>)}
            </select>
            
            <select
              value={dentistaSelecionado}
              onChange={(e) => setDentistaSelecionado(e.target.value)}
              className="px-2 py-1 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos dentistas</option>
              {dentistas.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
            </select>
            
            <button
              onClick={limparFiltros}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Rápido com cards simplificados */}
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

      {/* Próximos atendimentos - carrossel simplificado */}
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
                <button
                  onClick={() => handleAgendamentoClick(ag)}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Busca simplificada */}
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

      {/* Calendário Interativo */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVisualizacao('semanal')}
                  className={`px-3 py-1 text-xs rounded-lg transition ${visualizacao === 'semanal' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setVisualizacao('diaria')}
                  className={`px-3 py-1 text-xs rounded-lg transition ${visualizacao === 'diaria' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  Dia
                </button>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
                title="Atualizar"
              >
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
            salas={salas}
            visualizacao={visualizacao}
            onAgendamentoClick={handleAgendamentoClick}
            onAgendamentoMove={handleAgendamentoMove}
          />
        </div>
      </div>

      {/* Resultados da Busca (Popover) */}
      {searchTerm && pacientesFiltrados.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-xl shadow-2xl border z-40 overflow-hidden animate-in slide-in-from-right-5 duration-200">
          <div className="p-2 bg-blue-50 border-b flex justify-between items-center">
            <span className="text-xs font-medium">📋 Pacientes encontrados ({pacientesFiltrados.length})</span>
            <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {pacientesFiltrados.slice(0, 5).map(paciente => (
              <div 
                key={paciente.id}
                onClick={() => {
                  setPacienteSelecionado(paciente);
                  setShowQuickAgendamento(true);
                  setQuickAgendamento({ ...quickAgendamento, paciente_id: paciente.id });
                  setSearchTerm('');
                }}
                className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0 transition"
              >
                <div>
                  <p className="text-sm font-medium">{paciente.nome}</p>
                  <p className="text-[10px] text-gray-500">{paciente.telefone || 'Sem telefone'}</p>
                </div>
                <button className="text-blue-600 text-xs font-medium">Agendar →</button>
              </div>
            ))}
            {pacientesFiltrados.length > 5 && (
              <div className="p-2 text-center text-[10px] text-gray-400 border-t">
                + {pacientesFiltrados.length - 5} outros pacientes
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cadastro Rápido de Paciente */}
      {showQuickPaciente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
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
              <p className="text-[10px] text-gray-500 mt-1">Apenas campos essenciais</p>
            </div>
            
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Nome completo *</label>
                <input
                  type="text"
                  value={quickPaciente.nome}
                  onChange={(e) => setQuickPaciente({...quickPaciente, nome: e.target.value})}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Maria da Silva"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2 text-gray-400" size={14} />
                  <input
                    type="tel"
                    value={quickPaciente.telefone}
                    onChange={(e) => setQuickPaciente({...quickPaciente, telefone: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Convênio</label>
                <select
                  value={quickPaciente.convenio}
                  onChange={(e) => setQuickPaciente({...quickPaciente, convenio: e.target.value})}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Particular</option>
                  <option>Uniodonto</option>
                  <option>Amil Dental</option>
                  <option>Bradesco Dental</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button
                onClick={handleQuickSavePaciente}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition text-sm"
              >
                Salvar
              </button>
              <button
                onClick={() => setShowQuickPaciente(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agendamento Rápido */}
      {showQuickAgendamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
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
              <p className="text-[10px] text-gray-500 mt-1">Preencha os dados da consulta</p>
            </div>
            
            <div className="p-4 space-y-3">
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
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setShowQuickAgendamento(false);
                      setShowQuickPaciente(true);
                    }}
                    className="px-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                    title="Novo paciente"
                  >
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
                    {procedimentos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
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
                    {dentistas.map(d => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
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
                  <label className="block text-xs font-medium mb-1">Horário *</label>
                  <select
                    value={quickAgendamento.horario}
                    onChange={(e) => setQuickAgendamento({...quickAgendamento, horario: e.target.value})}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
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
            
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button
                onClick={handleQuickAgendamento}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
              >
                Confirmar
              </button>
              <button
                onClick={() => setShowQuickAgendamento(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
