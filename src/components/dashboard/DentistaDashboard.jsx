import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, LogOut, Activity, Users, ClipboardList, Play, PauseCircle, CheckCircle, XCircle, AlertCircle, Calendar as CalendarIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useMaterial } from '../../contexts/MaterialContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../Toast';
import ProntuarioView from '../prontuario/ProntuarioView';
import PauseCard from '../atendimento/PauseCard';

export default function DentistaDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const {
    agendamentos,
    atualizarAgendamento,
    adicionarAgendamento,
    pacientes,
    procedimentos
  } = useData();
  
  const {
    atendimentosPausados,
    pausarAtendimento: pausarAtendimentoGlobal,
    retomarAtendimento: retomarAtendimentoGlobal,
    consumirMateriais
  } = useMaterial();
  
  const [atendimentoAtivo, setAtendimentoAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Obter datas
  const hoje = new Date().toISOString().split('T')[0];
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().split('T')[0];
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemStr = ontem.toISOString().split('T')[0];
  
  // Separar agendamentos por data
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [agendamentosAmanha, setAgendamentosAmanha] = useState([]);
  const [agendamentosOntem, setAgendamentosOntem] = useState([]);
  const [agendamentosConcluidos, setAgendamentosConcluidos] = useState([]);

  // Carregar e separar agendamentos
  useEffect(() => {
    if (!agendamentos) return;
    
    const dentistaNome = user?.nome || 'Dra. Ana Silva';
    
    const filtrados = agendamentos.filter(ag => {
      const isDentista = ag.dentista_nome === dentistaNome;
      return isDentista;
    });
    
    // Separar por status e data
    const hojeList = filtrados.filter(ag => ag.data === hoje && ag.status !== 'concluido' && ag.status !== 'cancelado');
    const amanhaList = filtrados.filter(ag => ag.data === amanhaStr && ag.status !== 'concluido' && ag.status !== 'cancelado');
    const ontemList = filtrados.filter(ag => ag.data === ontemStr && ag.status !== 'concluido' && ag.status !== 'cancelado');
    const concluidosList = filtrados.filter(ag => ag.status === 'concluido');
    
    // Ordenar por horário
    const ordenar = (a, b) => (a.horario || '00:00').localeCompare(b.horario || '00:00');
    
    setAgendamentosHoje(hojeList.sort(ordenar));
    setAgendamentosAmanha(amanhaList.sort(ordenar));
    setAgendamentosOntem(ontemList.sort(ordenar));
    setAgendamentosConcluidos(concluidosList.sort(ordenar));
    setLoading(false);
  }, [agendamentos, user]);

  const handleLogout = () => {
    logout();
    showToast('Logout realizado com sucesso!', 'success');
    navigate('/login');
  };

  const selecionarAtendimento = (agendamento) => {
    if (atendimentoAtivo) {
      showToast(`Você já está atendendo ${atendimentoAtivo.paciente_nome}. Finalize ou pause antes de iniciar outro.`, 'error');
      return;
    }
    
    const estaPausado = atendimentosPausados?.some(p => p.atendimento_id === agendamento.id);
    if (estaPausado) {
      showToast('Este atendimento está pausado. Retome-o pelo card amarelo.', 'info');
      return;
    }
    
    if (agendamento.status === 'concluido') {
      showToast('Este atendimento já foi concluído!', 'info');
      return;
    }
    
    const pacienteCompleto = pacientes.find(p => p.id === agendamento.paciente_id || p.nome === agendamento.paciente_nome);
    
    setAtendimentoAtivo({
      ...agendamento,
      paciente: pacienteCompleto || { nome: agendamento.paciente_nome },
      status: 'em_andamento'
    });
    
    atualizarAgendamento({
      ...agendamento,
      status: 'em_andamento'
    });
    
    showToast(`Atendimento de ${agendamento.paciente_nome} iniciado!`, 'success');
  };

  const pausarAtendimento = () => {
    if (!atendimentoAtivo) {
      showToast('Nenhum atendimento ativo para pausar', 'error');
      return;
    }
    
    const novoPausado = {
      id: Date.now(),
      paciente: atendimentoAtivo.paciente_nome,
      paciente_id: atendimentoAtivo.paciente_id,
      procedimento: atendimentoAtivo.procedimento_nome,
      pausado_em: new Date().toISOString(),
      motivo: 'Aguardando exames/procedimentos complementares',
      atendimento_id: atendimentoAtivo.id,
      sala: atendimentoAtivo.sala,
      dentista: user?.nome
    };
    
    pausarAtendimentoGlobal(novoPausado);
    atualizarAgendamento({ ...atendimentoAtivo, status: 'pausado' });
    setAtendimentoAtivo(null);
    showToast(`Atendimento de ${novoPausado.paciente} pausado! Clique no card amarelo para retomar.`, 'info');
  };

  const retomarAtendimento = (pausado) => {
    if (atendimentoAtivo) {
      showToast(`Finalize ou pause ${atendimentoAtivo.paciente_nome} antes de retomar outro atendimento.`, 'error');
      return;
    }
    
    const agendamento = [...agendamentosHoje, ...agendamentosAmanha, ...agendamentosOntem].find(ag => ag.id === pausado.atendimento_id);
    
    if (agendamento) {
      const pacienteCompleto = pacientes.find(p => p.id === agendamento.paciente_id || p.nome === agendamento.paciente_nome);
      setAtendimentoAtivo({
        ...agendamento,
        paciente: pacienteCompleto || { nome: agendamento.paciente_nome },
        status: 'em_andamento'
      });
      atualizarAgendamento({ ...agendamento, status: 'em_andamento' });
    }
    
    retomarAtendimentoGlobal(pausado.id);
    showToast(`Atendimento de ${pausado.paciente} retomado!`, 'success');
  };

  const pedirRetorno = (retorno) => {
    const novoRetorno = {
      id: Date.now(),
      paciente_nome: retorno.paciente.nome,
      paciente_id: retorno.paciente.id,
      procedimento_nome: retorno.procedimento,
      dentista_nome: user?.nome,
      data: retorno.data,
      horario: retorno.horario,
      sala: retorno.sala,
      status: 'retorno_pendente',
      solicitar_retorno: true,
      is_retorno: true,
      observacoes: retorno.observacoes,
      created_at: new Date().toISOString()
    };
    
    adicionarAgendamento(novoRetorno);
    showToast(`Retorno solicitado para ${retorno.data} às ${retorno.horario}! Secretária notificada.`, 'success');
  };

  const finalizarAtendimento = async () => {
    if (!atendimentoAtivo) {
      showToast('Nenhum atendimento ativo', 'error');
      return;
    }
    
    let procedimentoId = atendimentoAtivo.procedimento_id;
    if (!procedimentoId) {
      const proc = procedimentos.find(p => p.nome === atendimentoAtivo.procedimento_nome);
      procedimentoId = proc?.id;
    }
    
    let salaNumero = String(atendimentoAtivo.sala || '01').trim();
    const salaMatch = salaNumero.match(/\d+/);
    salaNumero = salaMatch ? salaMatch[0].padStart(2, '0') : '01';
    
    const resultado = await consumirMateriais(
      procedimentoId,
      salaNumero,
      atendimentoAtivo.paciente_nome,
      atendimentoAtivo.dentista_nome
    );
    
    if (!resultado.success) {
      showToast(resultado.message, 'error');
      return;
    }
    
    atualizarAgendamento({ ...atendimentoAtivo, status: 'concluido' });
    setAtendimentoAtivo(null);
    showToast(`Atendimento finalizado! Materiais: R$ ${resultado.consumo?.reduce((s, i) => s + i.custo, 0).toFixed(2) || '0,00'}`, 'success');
  };

  const stats = {
    totalHoje: agendamentosHoje.length,
    totalAmanha: agendamentosAmanha.length,
    totalOntem: agendamentosOntem.length,
    concluidos: agendamentosConcluidos.length,
    pausados: atendimentosPausados?.filter(p => p.dentista === user?.nome).length || 0,
    em_andamento: atendimentoAtivo ? 1 : 0
  };

  const formatarDataLegivel = (dataStr) => {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  // Componente de card Kanban
  const KanbanCard = ({ agendamento, onClick, disabled }) => {
    const estaPausado = atendimentosPausados?.some(p => p.atendimento_id === agendamento.id);
    const isActive = atendimentoAtivo?.id === agendamento.id;
    
    const getStatusIcon = () => {
      if (isActive) return <Activity size={14} className="text-blue-500 animate-pulse" />;
      if (estaPausado) return <PauseCircle size={14} className="text-orange-500" />;
      if (agendamento.status === 'concluido') return <CheckCircle size={14} className="text-green-500" />;
      return <Clock size={14} className="text-gray-400" />;
    };
    
    const getStatusText = () => {
      if (isActive) return 'Em andamento';
      if (estaPausado) return 'Pausado';
      if (agendamento.status === 'concluido') return 'Concluído';
      return 'Agendado';
    };
    
    return (
      <div 
        onClick={() => !disabled && onClick(agendamento)} 
        className={`bg-white rounded-xl border p-3 mb-2 transition-all hover:shadow-md
          ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
          ${estaPausado ? 'border-orange-300 bg-orange-50' : 'border-gray-100'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}
        `}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon()}
              <span className="font-semibold text-gray-800">{agendamento.paciente_nome}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={12} />
              <span>{agendamento.horario}</span>
              <span className="text-gray-300">•</span>
              <span>Sala {agendamento.sala}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{agendamento.procedimento_nome}</p>
          </div>
          <div className="text-right">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              isActive ? 'bg-blue-100 text-blue-700' :
              estaPausado ? 'bg-orange-100 text-orange-700' :
              agendamento.status === 'concluido' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>
        {disabled && (
          <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
            <AlertCircle size={10} /> Aguardando finalizar {atendimentoAtivo?.paciente_nome}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Activity className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Painel do Dentista</h1>
                <p className="text-xs text-gray-500">{user?.nome} - Gerencie seus atendimentos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {atendimentoAtivo && (
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  <Activity size={14} className="animate-pulse" />
                  <span>Atendendo: {atendimentoAtivo.paciente_nome}</span>
                </div>
              )}
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition text-sm">
                <LogOut size={16} /> Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Pausa */}
      <PauseCard 
        pausados={atendimentosPausados?.filter(p => p.dentista === user?.nome) || []} 
        onRetomar={retomarAtendimento} 
      />

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 text-white">
            <p className="text-xs opacity-90">Hoje</p>
            <p className="text-2xl font-bold">{stats.totalHoje}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-3 text-white">
            <p className="text-xs opacity-90">Amanhã</p>
            <p className="text-2xl font-bold">{stats.totalAmanha}</p>
          </div>
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl p-3 text-white">
            <p className="text-xs opacity-90">Ontem</p>
            <p className="text-2xl font-bold">{stats.totalOntem}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3 text-white">
            <p className="text-xs opacity-90">Concluídos</p>
            <p className="text-2xl font-bold">{stats.concluidos}</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-3 text-white">
            <p className="text-xs opacity-90">Pausados</p>
            <p className="text-2xl font-bold">{stats.pausados}</p>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto max-w-7xl mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[600px]">
          
          {/* Coluna ONTEM */}
          <div className="bg-gray-100 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-250px)]">
            <div className="p-3 bg-gray-200 border-b">
              <div className="flex items-center gap-2">
                <ArrowLeft size={16} className="text-gray-500" />
                <h2 className="font-bold text-gray-700">📅 Ontem</h2>
                <span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded-full">{formatarDataLegivel(ontemStr)}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {agendamentosOntem.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                  Nenhum atendimento
                </div>
              ) : (
                agendamentosOntem.map(ag => (
                  <KanbanCard 
                    key={ag.id} 
                    agendamento={ag} 
                    onClick={selecionarAtendimento}
                    disabled={!!atendimentoAtivo && atendimentoAtivo.id !== ag.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* Coluna HOJE */}
          <div className="bg-blue-50 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-250px)] ring-2 ring-blue-200">
            <div className="p-3 bg-blue-100 border-b">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-blue-600" />
                <h2 className="font-bold text-blue-800">📅 Hoje</h2>
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">{formatarDataLegivel(hoje)}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {agendamentosHoje.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                  Nenhum atendimento hoje
                </div>
              ) : (
                agendamentosHoje.map(ag => (
                  <KanbanCard 
                    key={ag.id} 
                    agendamento={ag} 
                    onClick={selecionarAtendimento}
                    disabled={!!atendimentoAtivo && atendimentoAtivo.id !== ag.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* Coluna AMANHÃ */}
          <div className="bg-purple-50 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-250px)]">
            <div className="p-3 bg-purple-100 border-b">
              <div className="flex items-center gap-2">
                <ArrowRight size={16} className="text-purple-500" />
                <h2 className="font-bold text-purple-800">📅 Amanhã</h2>
                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">{formatarDataLegivel(amanhaStr)}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {agendamentosAmanha.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                  Nenhum atendimento amanhã
                </div>
              ) : (
                agendamentosAmanha.map(ag => (
                  <KanbanCard 
                    key={ag.id} 
                    agendamento={ag} 
                    onClick={selecionarAtendimento}
                    disabled={!!atendimentoAtivo && atendimentoAtivo.id !== ag.id}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prontuário (Modal/Drawer quando atendimento ativo) */}
      {atendimentoAtivo && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-blue-600" />
                <h2 className="font-bold">Atendimento em andamento</h2>
                <span className="text-sm text-gray-500">| {atendimentoAtivo.paciente_nome}</span>
              </div>
              <button 
                onClick={() => {
                  if (confirm('Tem certeza que deseja fechar? O atendimento continuará em andamento.')) {
                    setAtendimentoAtivo(null);
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ProntuarioView
                paciente={atendimentoAtivo.paciente}
                atendimento={atendimentoAtivo}
                onPausar={pausarAtendimento}
                onRetomar={() => {}}
                onPedirRetorno={pedirRetorno}
                onFinalizar={finalizarAtendimento}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
