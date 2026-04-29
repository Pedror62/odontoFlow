import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CalendarPlus, Users, List, LogOut, Activity, 
  Bell, Search, UserPlus, Clock, CheckCircle, 
  XCircle, AlertCircle, Phone, Mail, MapPin,
  CreditCard, Stethoscope, Calendar, ChevronRight,
  Plus, Edit, Trash2, Save, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../Toast';
import AgendaCalendar from '../agenda/AgendaCalendar';

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
    adicionarAgendamento
  } = useData();
  
  const [activeTab, setActiveTab] = useState('agenda');
  const [showQuickPaciente, setShowQuickPaciente] = useState(false);
  const [showQuickAgendamento, setShowQuickAgendamento] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [pacienteEdit, setPacienteEdit] = useState(null);
  
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

  // Filtro de pacientes
  const pacientesFiltrados = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.telefone?.includes(searchTerm)
  );

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + N = Novo Agendamento
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowQuickAgendamento(true);
      }
      // Ctrl + P = Novo Paciente
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        setShowQuickPaciente(true);
      }
      // Escape = Fechar modais
      if (e.key === 'Escape') {
        setShowQuickPaciente(false);
        setShowQuickAgendamento(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    showToast('Logout realizado com sucesso!', 'success');
    navigate('/login');
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
    
    // Limpar formulário
    setQuickPaciente({ nome: '', telefone: '', email: '', convenio: 'Particular' });
    setShowQuickPaciente(false);
    
    // Se tiver no modo agendamento, já selecionar o paciente
    if (showQuickAgendamento) {
      setQuickAgendamento({ ...quickAgendamento, paciente_id: novoPaciente.id });
      setPacienteSelecionado(novoPaciente);
      showToast(`Paciente ${novoPaciente.nome} selecionado para agendamento`, 'info');
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
    const plano = planos.find(p => p.id === 3); // Particular padrão
    
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
    
    // Limpar
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

  // Próximos atendimentos (próximas 4 horas)
  const agora = new Date();
  const horaAtual = agora.getHours();
  const proximosAtendimentos = agendamentos
    .filter(ag => {
      if (!ag.horario || ag.status === 'cancelado') return false;
      const horaAg = parseInt(ag.horario.split(':')[0]);
      return horaAg >= horaAtual && horaAg <= horaAtual + 4;
    })
    .slice(0, 5);

  const stats = {
    totalPacientes: pacientes.length,
    totalAgendamentos: agendamentos.length,
    agendamentosHoje: agendamentos.filter(ag => ag.data === new Date().toISOString().split('T')[0]).length,
    atrasados: agendamentos.filter(ag => {
      if (!ag.horario || ag.status === 'cancelado') return false;
      const horaAg = parseInt(ag.horario.split(':')[0]);
      return horaAg < horaAtual;
    }).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Activity size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">OdontoFlow</h1>
                <p className="text-xs text-gray-500">Secretaria • {user?.nome}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Indicadores Rápidos */}
              <div className="hidden md:flex gap-2">
                <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  <CheckCircle size={12} /> {stats.agendamentosHoje} hoje
                </div>
                {stats.atrasados > 0 && (
                  <div className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    <AlertCircle size={12} /> {stats.atrasados} atrasados
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowQuickPaciente(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                title="Ctrl + P"
              >
                <UserPlus size={16} /> Rápido
              </button>
              
              <button
                onClick={() => setShowQuickAgendamento(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                title="Ctrl + N"
              >
                <CalendarPlus size={16} /> Agendar
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

      {/* Dashboard Rápido - Próximos Atendimentos */}
      {proximosAtendimentos.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Clock size={14} /> Próximos atendimentos
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {proximosAtendimentos.map(ag => (
                <div key={ag.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 min-w-[200px]">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {ag.paciente_nome?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ag.paciente_nome}</p>
                    <p className="text-xs text-gray-500">{ag.horario} • {ag.procedimento_nome}</p>
                  </div>
                  <button className="text-green-600 text-xs font-medium hover:bg-green-50 px-2 py-1 rounded">
                    Check-in
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Barra de Busca Rápida */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar paciente por nome, telefone ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-3 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          {/* Resultados da Busca - Mostra enquanto digita */}
          {searchTerm && pacientesFiltrados.length > 0 && (
            <div className="mt-2 bg-white rounded-xl shadow-lg border overflow-hidden">
              {pacientesFiltrados.slice(0, 5).map(paciente => (
                <div 
                  key={paciente.id}
                  onClick={() => {
                    setPacienteSelecionado(paciente);
                    setShowQuickAgendamento(true);
                    setQuickAgendamento({ ...quickAgendamento, paciente_id: paciente.id });
                    setSearchTerm('');
                  }}
                  className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{paciente.nome}</p>
                    <p className="text-xs text-gray-500">{paciente.telefone || 'Sem telefone'}</p>
                  </div>
                  <button className="text-blue-600 text-sm">Agendar →</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cards Rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-3 border-l-4 border-blue-500">
            <p className="text-xs text-gray-500">Pacientes</p>
            <p className="text-2xl font-bold">{stats.totalPacientes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 border-l-4 border-green-500">
            <p className="text-xs text-gray-500">Agendamentos</p>
            <p className="text-2xl font-bold">{stats.totalAgendamentos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 border-l-4 border-yellow-500">
            <p className="text-xs text-gray-500">Hoje</p>
            <p className="text-2xl font-bold">{stats.agendamentosHoje}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 border-l-4 border-purple-500">
            <p className="text-xs text-gray-500">Retornos Pendentes</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>

        {/* Calendário de Agenda */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">📅 Agenda de Hoje</h2>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <AgendaCalendar 
            agendamentos={agendamentos}
            onSelectAgendamento={(ag) => console.log('Selecionado:', ag)}
          />
        </div>
      </div>

      {/* Modal de Cadastro Rápido de Paciente */}
      {showQuickPaciente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-r from-green-50 to-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserPlus className="text-green-600" size={24} />
                  <h2 className="text-xl font-bold">Cadastro Rápido</h2>
                </div>
                <button onClick={() => setShowQuickPaciente(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Apenas campos essenciais para agilizar</p>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome completo *</label>
                <input
                  type="text"
                  value={quickPaciente.nome}
                  onChange={(e) => setQuickPaciente({...quickPaciente, nome: e.target.value})}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Maria da Silva"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Telefone (WhatsApp)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="tel"
                    value={quickPaciente.telefone}
                    onChange={(e) => setQuickPaciente({...quickPaciente, telefone: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Convênio</label>
                <select
                  value={quickPaciente.convenio}
                  onChange={(e) => setQuickPaciente({...quickPaciente, convenio: e.target.value})}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Particular</option>
                  <option>Uniodonto</option>
                  <option>Amil Dental</option>
                  <option>Bradesco Dental</option>
                </select>
              </div>
            </div>
            
            <div className="p-5 border-t bg-gray-50 flex gap-3">
              <button
                onClick={handleQuickSavePaciente}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition"
              >
                Salvar e Continuar
              </button>
              <button
                onClick={() => setShowQuickPaciente(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agendamento Rápido */}
      {showQuickAgendamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-white sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="text-blue-600" size={24} />
                  <h2 className="text-xl font-bold">Agendamento Rápido</h2>
                </div>
                <button onClick={() => setShowQuickAgendamento(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Seleção de Paciente */}
              <div>
                <label className="block text-sm font-medium mb-1">Paciente *</label>
                <div className="flex gap-2">
                  <select
                    value={quickAgendamento.paciente_id}
                    onChange={(e) => {
                      setQuickAgendamento({...quickAgendamento, paciente_id: e.target.value});
                      const p = pacientes.find(p => p.id == e.target.value);
                      setPacienteSelecionado(p);
                    }}
                    className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
                    title="Novo paciente"
                  >
                    <UserPlus size={20} />
                  </button>
                </div>
                {pacienteSelecionado && (
                  <p className="text-xs text-gray-500 mt-1">
                    📞 {pacienteSelecionado.telefone || 'Sem telefone'} • 🏥 {pacienteSelecionado.convenio || 'Particular'}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Procedimento *</label>
                  <select
                    value={quickAgendamento.procedimento_id}
                    onChange={(e) => setQuickAgendamento({...quickAgendamento, procedimento_id: e.target.value})}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {procedimentos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Dentista *</label>
                  <select
                    value={quickAgendamento.dentista_id}
                    onChange={(e) => setQuickAgendamento({...quickAgendamento, dentista_id: e.target.value})}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium mb-1">Data *</label>
                  <input
                    type="date"
                    value={quickAgendamento.data}
                    onChange={(e) => setQuickAgendamento({...quickAgendamento, data: e.target.value})}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Horário *</label>
                  <select
                    value={quickAgendamento.horario}
                    onChange={(e) => setQuickAgendamento({...quickAgendamento, horario: e.target.value})}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Sala</label>
                <select
                  value={quickAgendamento.sala}
                  onChange={(e) => setQuickAgendamento({...quickAgendamento, sala: e.target.value})}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>01</option>
                  <option>02</option>
                  <option>03</option>
                </select>
              </div>
            </div>
            
            <div className="p-5 border-t bg-gray-50 flex gap-3 sticky bottom-0">
              <button
                onClick={handleQuickAgendamento}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
              >
                Confirmar Agendamento
              </button>
              <button
                onClick={() => setShowQuickAgendamento(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
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
