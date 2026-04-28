import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, LogOut, Activity, Users, ClipboardList, Play } from 'lucide-react';
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
  const [meusAgendamentos, setMeusAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroData, setFiltroData] = useState('hoje'); // 'hoje', 'todos', 'data'

  // Filtrar agendamentos do dentista logado
  useEffect(() => {
    if (!agendamentos) return;
    
    const dentistaNome = user?.nome || 'Dra. Ana Silva';
    const hoje = new Date().toISOString().split('T')[0];
    
    let filtrados = agendamentos.filter(ag => {
      const isDentista = ag.dentista_nome === dentistaNome;
      const naoConcluido = ag.status !== 'concluido' && ag.status !== 'cancelado';
      return isDentista && naoConcluido;
    });
    
    // Aplicar filtro de data
    if (filtroData === 'hoje') {
      filtrados = filtrados.filter(ag => ag.data === hoje);
    }
    
    // Ordenar por data e horário
    filtrados.sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return (a.horario || '00:00').localeCompare(b.horario || '00:00');
    });
    
    setMeusAgendamentos(filtrados);
    setLoading(false);
  }, [agendamentos, user, filtroData]);

  const handleLogout = () => {
    logout();
    showToast('Logout realizado com sucesso!', 'success');
    navigate('/login');
  };

  const selecionarAtendimento = (agendamento) => {
    if (atendimentoAtivo?.id === agendamento.id) return;
    
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
    if (!atendimentoAtivo) return;
    
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
    showToast('Atendimento pausado! Clique no card amarelo para retomar.', 'info');
  };

  const retomarAtendimento = (pausado) => {
    const agendamento = meusAgendamentos.find(ag => ag.id === pausado.atendimento_id) || 
                        agendamentos.find(ag => ag.id === pausado.atendimento_id);
    
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

  const formatarData = (data) => {
    if (!data) return 'Data não definida';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const stats = {
    total: meusAgendamentos.length,
    em_andamento: atendimentoAtivo ? 1 : 0,
    pausados: atendimentosPausados?.filter(p => p.dentista === user?.nome).length || 0,
    concluidos: agendamentos?.filter(ag => ag.dentista_nome === user?.nome && ag.status === 'concluido').length || 0
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
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Activity className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Painel do Dentista</h1>
                <p className="text-sm text-gray-500">{user?.nome} - Gerencie seus atendimentos</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Filtro de data */}
              <select
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hoje">📅 Hoje</option>
                <option value="todos">📋 Todos os agendamentos</option>
              </select>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                <LogOut size={18} /> Sair
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">{filtroData === 'hoje' ? 'Pendentes Hoje' : 'Total Pendentes'}</p><p className="text-2xl font-bold">{stats.total}</p></div>
              <Calendar className="text-blue-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Em Andamento</p><p className="text-2xl font-bold">{stats.em_andamento}</p></div>
              <Activity className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Pausados</p><p className="text-2xl font-bold text-yellow-600">{stats.pausados}</p></div>
              <Clock className="text-yellow-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Concluídos</p><p className="text-2xl font-bold text-green-600">{stats.concluidos}</p></div>
              <ClipboardList className="text-purple-500" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto px-4 pb-6">
        {/* Agenda */}
        <div className="w-96 bg-white rounded-lg shadow mr-6 overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold flex items-center gap-2"><Calendar size={20} /> {filtroData === 'hoje' ? 'Agenda de Hoje' : 'Todos os Agendamentos'}</h2>
            <p className="text-sm text-gray-500 mt-1">{filtroData === 'hoje' ? new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Lista completa'}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {meusAgendamentos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar size={48} className="mx-auto mb-3" />
                <p>Nenhum agendamento encontrado</p>
                <p className="text-sm mt-2">Aguardando agendamentos da secretaria</p>
              </div>
            ) : (
              meusAgendamentos.map(ag => {
                const estaPausado = atendimentosPausados?.some(p => p.atendimento_id === ag.id);
                const isActive = atendimentoAtivo?.id === ag.id;
                return (
                  <div key={ag.id} onClick={() => selecionarAtendimento(ag)} className={`bg-white rounded-lg shadow border p-4 mb-3 cursor-pointer transition hover:shadow-md ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''} ${estaPausado ? 'border-yellow-400 bg-yellow-50' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock size={14} className="text-gray-400" />
                          <span className="font-semibold text-lg">{ag.horario}</span>
                          {filtroData !== 'hoje' && (
                            <span className="text-xs text-gray-400 ml-2">{formatarData(ag.data)}</span>
                          )}
                        </div>
                        <p className="font-medium text-gray-800">{ag.paciente_nome}</p>
                        <p className="text-sm text-gray-600">{ag.procedimento_nome}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Sala {ag.sala}</p>
                        <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${isActive ? 'bg-blue-100 text-blue-700' : estaPausado ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {isActive ? 'Em andamento' : estaPausado ? 'Pausado' : 'Agendado'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2"><ChevronRight size={16} className="text-gray-400" /></div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Prontuário */}
        <div className="flex-1">
          {atendimentoAtivo ? (
            <ProntuarioView
              paciente={atendimentoAtivo.paciente}
              atendimento={atendimentoAtivo}
              onPausar={pausarAtendimento}
              onRetomar={() => {}}
              onPedirRetorno={pedirRetorno}
              onFinalizar={finalizarAtendimento}
            />
          ) : (
            <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhum atendimento selecionado</p>
                <p className="text-sm mt-2">Clique em um paciente na agenda para iniciar o atendimento</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}