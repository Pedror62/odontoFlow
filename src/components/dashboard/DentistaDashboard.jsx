import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, ChevronRight, LogOut, Activity, Users, ClipboardList, 
  Play, PauseCircle, CheckCircle, XCircle, AlertCircle, Calendar as CalendarIcon, 
  ArrowRight, ArrowLeft, Eye, Search, Download, Sun, Moon, TrendingUp, 
  AlarmClock, CheckCheck, Timer, User, History, Clock as ClockIcon,
  Zap, Bell, Info
} from 'lucide-react';
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
    procedimentos,
    prontuarios
  } = useData();
  
  const {
    atendimentosPausados,
    pausarAtendimento: pausarAtendimentoGlobal,
    retomarAtendimento: retomarAtendimentoGlobal,
    consumirMateriais
  } = useMaterial();
  
  const [atendimentoAtivo, setAtendimentoAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisualizacao, setModalVisualizacao] = useState(null);
  const [buscaTermo, setBuscaTermo] = useState('');
  const [temaEscuro, setTemaEscuro] = useState(false);
  const [tempoAtendimento, setTempoAtendimento] = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);
  
  // Tooltip
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Obter datas
  const hoje = new Date().toISOString().split('T')[0];
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().split('T')[0];
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemStr = ontem.toISOString().split('T')[0];
  
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [agendamentosAmanha, setAgendamentosAmanha] = useState([]);
  const [agendamentosOntem, setAgendamentosOntem] = useState([]);
  const [agendamentosConcluidos, setAgendamentosConcluidos] = useState([]);

  // Timer do atendimento ativo
  useEffect(() => {
    let timer;
    if (atendimentoAtivo && !timerAtivo) {
      setTimerAtivo(true);
      timer = setInterval(() => {
        setTempoAtendimento(prev => prev + 1);
      }, 1000);
    } else if (!atendimentoAtivo) {
      setTempoAtendimento(0);
      setTimerAtivo(false);
    }
    return () => clearInterval(timer);
  }, [atendimentoAtivo]);

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const secs = segundos % 60;
    if (horas > 0) return `${horas}h ${minutos}m`;
    if (minutos > 0) return `${minutos}m ${secs}s`;
    return `${secs}s`;
  };

  // Carregar agendamentos
  useEffect(() => {
    if (!agendamentos) return;
    
    const dentistaNome = user?.nome || 'Dra. Ana Silva';
    
    const filtrados = agendamentos.filter(ag => {
      const isDentista = ag.dentista_nome === dentistaNome;
      return isDentista;
    });
    
    const hojeList = filtrados.filter(ag => ag.data === hoje && ag.status !== 'concluido' && ag.status !== 'cancelado');
    const amanhaList = filtrados.filter(ag => ag.data === amanhaStr && ag.status !== 'concluido' && ag.status !== 'cancelado');
    const ontemList = filtrados.filter(ag => ag.data === ontemStr && ag.status !== 'concluido' && ag.status !== 'cancelado');
    const concluidosList = filtrados.filter(ag => ag.status === 'concluido');
    
    const ordenar = (a, b) => (a.horario || '00:00').localeCompare(b.horario || '00:00');
    
    setAgendamentosHoje(hojeList.sort(ordenar));
    setAgendamentosAmanha(amanhaList.sort(ordenar));
    setAgendamentosOntem(ontemList.sort(ordenar));
    setAgendamentosConcluidos(concluidosList.sort(ordenar));
    setLoading(false);
  }, [agendamentos, user]);

  // Tooltip functions
  const handleMouseEnter = (event, agendamento) => {
    const pacienteInfo = pacientes.find(p => 
      p.id === agendamento.paciente_id || p.nome === agendamento.paciente_nome
    );
    
    if (pacienteInfo) {
      const ultimoAtendimento = agendamentos
        .filter(ag => ag.paciente_id === pacienteInfo.id || ag.paciente_nome === pacienteInfo.nome)
        .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
      
      setTooltipInfo({
        ...pacienteInfo,
        ultimoAtendimento: ultimoAtendimento?.data || 'Nenhum'
      });
      setTooltipVisible(true);
      
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltipVisible(false);
    setTooltipInfo(null);
  };

  const calcularPrioridade = (horario) => {
    const agora = new Date();
    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();
    const [horaAg, minutoAg] = horario.split(':').map(Number);
    
    const diffMinutos = (horaAg - horaAtual) * 60 + (minutoAg - minutoAtual);
    
    if (diffMinutos < 0) return { nivel: 'urgente', cor: 'bg-red-100 border-red-500', texto: 'Atrasado', icone: '🚨' };
    if (diffMinutos < 15) return { nivel: 'alta', cor: 'bg-orange-100 border-orange-500', texto: 'Em breve', icone: '⚠️' };
    if (diffMinutos < 60) return { nivel: 'media', cor: 'bg-yellow-100 border-yellow-400', texto: 'Próximo', icone: '⏰' };
    return { nivel: 'normal', cor: 'bg-white', texto: 'Agendado', icone: '📅' };
  };

  const handleLogout = () => {
    logout();
    showToast('Logout realizado com sucesso!', 'success');
    navigate('/login');
  };

  const iniciarAtendimento = (agendamento) => {
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
    
    atualizarAgendamento({ ...agendamento, status: 'em_andamento' });
    showToast(`Atendimento de ${agendamento.paciente_nome} iniciado!`, 'success');
  };

  const visualizarAgendamento = (agendamento) => {
    const pacienteCompleto = pacientes.find(p => p.id === agendamento.paciente_id || p.nome === agendamento.paciente_nome);
    setModalVisualizacao({
      ...agendamento,
      paciente: pacienteCompleto || { nome: agendamento.paciente_nome }
    });
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
    if (!atendimentoAtivo) return;
    
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
    showToast(`Atendimento finalizado! Materiais consumidos: R$ ${resultado.consumo?.reduce((s, i) => s + i.custo, 0).toFixed(2)}`, 'success');
  };

  const formatarDataLegivel = (dataStr) => {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  // KanbanCard Component
  const KanbanCard = ({ agendamento, onClick, onVisualizar, disabled, isVisualizacaoOnly = false }) => {
    const estaPausado = atendimentosPausados?.some(p => p.atendimento_id === agendamento.id);
    const isActive = atendimentoAtivo?.id === agendamento.id;
    const prioridade = calcularPrioridade(agendamento.horario);
    
    return (
      <div className="relative">
        <div 
          onClick={() => !disabled && !isVisualizacaoOnly && onClick(agendamento)}
          onMouseEnter={(e) => handleMouseEnter(e, agendamento)}
          onMouseLeave={handleMouseLeave}
          className={`rounded-xl border p-3 mb-2 transition-all hover:shadow-md cursor-pointer
            ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
            ${estaPausado ? 'border-orange-300 bg-orange-50' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}
          `}
          style={{
            borderLeft: `4px solid ${prioridade.nivel === 'urgente' ? '#ef4444' : prioridade.nivel === 'alta' ? '#f97316' : prioridade.nivel === 'media' ? '#eab308' : '#3b82f6'}`
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{prioridade.icone}</span>
                <span className="font-semibold text-gray-800">{agendamento.paciente_nome}</span>
                {prioridade.nivel === 'urgente' && (
                  <span className="text-red-500 text-[10px] bg-red-100 px-1 rounded animate-pulse">ATRASADO</span>
                )}
                {isActive && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Timer size={10} /> {formatarTempo(tempoAtendimento)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} />
                <span className={prioridade.nivel === 'urgente' ? 'text-red-600 font-medium' : ''}>{agendamento.horario}</span>
                <span className="text-gray-300">•</span>
                <span>Sala {agendamento.sala}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{agendamento.procedimento_nome}</p>
            </div>
            <div className="text-right">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                isActive ? 'bg-blue-100 text-blue-700' :
                estaPausado ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {isActive ? 'Em andamento' : estaPausado ? 'Pausado' : prioridade.texto}
              </span>
              {isVisualizacaoOnly && (
                <button
                  onClick={() => onVisualizar(agendamento)}
                  className="block mt-1 text-[10px] text-gray-500 hover:text-gray-700 flex items-center justify-end gap-1 w-full"
                >
                  <Eye size={10} /> Visualizar
                </button>
              )}
            </div>
          </div>
        </div>
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

  const agendamentosHojeFiltrados = agendamentosHoje.filter(ag => 
    ag.paciente_nome?.toLowerCase().includes(buscaTermo.toLowerCase()) ||
    ag.procedimento_nome?.toLowerCase().includes(buscaTermo.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${temaEscuro ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Header */}
      <div className={`${temaEscuro ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm border-b sticky top-0 z-20`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Activity className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${temaEscuro ? 'text-white' : 'text-gray-800'}`}>Painel do Dentista</h1>
                <p className={`text-xs ${temaEscuro ? 'text-gray-400' : 'text-gray-500'}`}>{user?.nome}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {atendimentoAtivo && (
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  <Timer size={14} className="animate-pulse" />
                  <span>{formatarTempo(tempoAtendimento)} - {atendimentoAtivo.paciente_nome}</span>
                </div>
              )}
              <button 
                onClick={() => setTemaEscuro(!temaEscuro)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                {temaEscuro ? <Sun size={18} /> : <Moon size={18} />}
              </button>
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

      {/* Barra de Busca */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar paciente por nome ou procedimento..."
            value={buscaTermo}
            onChange={(e) => setBuscaTermo(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${temaEscuro ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto max-w-7xl mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[600px]">
          
          {/* Coluna ONTEM */}
          <div className={`${temaEscuro ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl overflow-hidden flex flex-col h-[calc(100vh-280px)]`}>
            <div className="p-3 bg-gray-200 border-b dark:bg-gray-700">
              <div className="flex items-center gap-2">
                <ArrowLeft size={16} className="text-gray-500" />
                <h2 className="font-bold text-gray-700 dark:text-gray-300">📅 Ontem</h2>
                <span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded-full">{formatarDataLegivel(ontemStr)}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {agendamentosOntem.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Nenhum atendimento</div>
              ) : (
                agendamentosOntem.map(ag => (
                  <KanbanCard 
                    key={ag.id} 
                    agendamento={ag} 
                    onClick={() => {}} 
                    onVisualizar={visualizarAgendamento}
                    isVisualizacaoOnly={true}
                    disabled={false}
                  />
                ))
              )}
            </div>
          </div>

          {/* Coluna HOJE */}
          <div className={`${temaEscuro ? 'bg-gray-800' : 'bg-blue-50'} rounded-xl overflow-hidden flex flex-col h-[calc(100vh-280px)] ring-2 ring-blue-200`}>
            <div className="p-3 bg-blue-100 border-b dark:bg-blue-900">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-blue-600" />
                <h2 className="font-bold text-blue-800 dark:text-blue-200">📅 Hoje</h2>
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">{formatarDataLegivel(hoje)}</span>
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ {agendamentosHoje.length} atendimentos</span>
              </div>
              {buscaTermo && agendamentosHojeFiltrados.length !== agendamentosHoje.length && (
                <p className="text-xs text-blue-600 mt-1">Encontrados {agendamentosHojeFiltrados.length} de {agendamentosHoje.length}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {agendamentosHojeFiltrados.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {buscaTermo ? 'Nenhum resultado encontrado' : 'Nenhum atendimento hoje'}
                </div>
              ) : (
                agendamentosHojeFiltrados.map(ag => (
                  <KanbanCard 
                    key={ag.id} 
                    agendamento={ag} 
                    onClick={iniciarAtendimento}
                    disabled={!!atendimentoAtivo && atendimentoAtivo.id !== ag.id}
                    isVisualizacaoOnly={false}
                  />
                ))
              )}
            </div>
          </div>

          {/* Coluna AMANHÃ */}
          <div className={`${temaEscuro ? 'bg-gray-800' : 'bg-purple-50'} rounded-xl overflow-hidden flex flex-col h-[calc(100vh-280px)]`}>
            <div className="p-3 bg-purple-100 border-b dark:bg-purple-900">
              <div className="flex items-center gap-2">
                <ArrowRight size={16} className="text-purple-500" />
                <h2 className="font-bold text-purple-800 dark:text-purple-200">📅 Amanhã</h2>
                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">{formatarDataLegivel(amanhaStr)}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {agendamentosAmanha.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Nenhum atendimento amanhã</div>
              ) : (
                agendamentosAmanha.map(ag => (
                  <KanbanCard 
                    key={ag.id} 
                    agendamento={ag} 
                    onClick={() => {}} 
                    onVisualizar={visualizarAgendamento}
                    isVisualizacaoOnly={true}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip (Pré-visualização Rápida) */}
      {tooltipVisible && tooltipInfo && (
        <div 
          className="fixed z-[100] bg-gray-900 text-white rounded-lg shadow-xl p-3 text-sm animate-in fade-in zoom-in duration-200"
          style={{
            left: `${tooltipPosition.x - 150}px`,
            top: `${tooltipPosition.y - 80}px`,
            minWidth: '250px'
          }}
        >
          <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
            <User size={14} className="text-blue-400" />
            <span className="font-semibold">{tooltipInfo.nome}</span>
          </div>
          {tooltipInfo.telefone && (
            <div className="text-xs text-gray-300 mb-1 flex items-center gap-2">
              <span>📞</span> {tooltipInfo.telefone}
            </div>
          )}
          {tooltipInfo.email && (
            <div className="text-xs text-gray-300 mb-1 flex items-center gap-2">
              <span>✉️</span> {tooltipInfo.email}
            </div>
          )}
          {tooltipInfo.convenio && (
            <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
              <span>🏥</span> {tooltipInfo.convenio}
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-400 flex items-center gap-2">
            <Clock size={10} />
            <span>Último atendimento: {tooltipInfo.ultimoAtendimento || 'Nenhum'}</span>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
        </div>
      )}

      {/* Modal de Atendimento Ativo */}
      {atendimentoAtivo && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-blue-600" />
                <h2 className="font-bold">Atendimento em andamento</h2>
                <span className="text-sm text-gray-500">| {atendimentoAtivo.paciente_nome}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Timer size={12} /> {formatarTempo(tempoAtendimento)}
                </span>
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

      {/* Modal de Visualização */}
      {modalVisualizacao && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-2">
                <Eye size={20} className="text-gray-500" />
                <h2 className="font-bold">Visualização de Agendamento</h2>
                <span className="text-sm text-gray-500">| {modalVisualizacao.paciente_nome}</span>
              </div>
              <button onClick={() => setModalVisualizacao(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 uppercase">Paciente</p>
                  <p className="font-medium">{modalVisualizacao.paciente_nome}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 uppercase">Procedimento</p>
                  <p className="font-medium">{modalVisualizacao.procedimento_nome}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 uppercase">Data e Horário</p>
                  <p className="font-medium">{formatarDataLegivel(modalVisualizacao.data)} às {modalVisualizacao.horario}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 uppercase">Sala</p>
                  <p className="font-medium">Sala {modalVisualizacao.sala}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button onClick={() => setModalVisualizacao(null)} className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
