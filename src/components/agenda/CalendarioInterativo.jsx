import React, { useState, useEffect } from 'react';
import { 
  Clock, Stethoscope, User, Activity, CheckCircle, XCircle, 
  AlertCircle, Calendar, ChevronLeft, ChevronRight, 
  Edit, Trash2, MapPin, DollarSign,
  ZoomIn, ZoomOut, RefreshCw, X, AlertTriangle
} from 'lucide-react';
import { showToast } from '../Toast';

// Cores por status
const STATUS_CONFIG = {
  agendado: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', icon: '🕐', label: 'Agendado' },
  confirmado: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', icon: '✅', label: 'Confirmado' },
  em_andamento: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', icon: '⚡', label: 'Em andamento' },
  concluido: { bg: 'bg-gray-50', border: 'border-gray-500', text: 'text-gray-600', icon: '✓', label: 'Concluído' },
  cancelado: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600', icon: '✗', label: 'Cancelado' },
  pausado: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', icon: '⏸', label: 'Pausado' }
};

// Mapeamento de duração dos procedimentos (minutos)
const DURACAO_POR_PROCEDIMENTO = {
  'Limpeza': 30,
  'Canal': 90,
  'Extração': 45,
  'Restauração': 30,
  'Clareamento': 60,
  'default': 30
};

// Gerar todos os horários disponíveis (08:00 às 20:00, intervalos de 30 min)
const TODOS_HORARIOS = [];
for (let i = 8; i <= 20; i++) {
  TODOS_HORARIOS.push(`${i.toString().padStart(2, '0')}:00`);
  TODOS_HORARIOS.push(`${i.toString().padStart(2, '0')}:30`);
}

// Converter horário para minutos
const horarioParaMinutos = (horario) => {
  const [hora, minuto] = horario.split(':').map(Number);
  return hora * 60 + minuto;
};

// Converter minutos para horário
const minutosParaHorario = (minutos) => {
  const hora = Math.floor(minutos / 60);
  const minuto = minutos % 60;
  return `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
};

// Calcular horário de fim baseado na duração
const calcularHorarioFim = (horarioInicio, duracaoMinutos) => {
  const minutosInicio = horarioParaMinutos(horarioInicio);
  const minutosFim = minutosInicio + duracaoMinutos;
  return minutosParaHorario(minutosFim);
};

// Verificar conflito de horário entre dois agendamentos
const verificarConflito = (ag1, ag2) => {
  if (ag1.sala !== ag2.sala) return false;
  if (ag1.data !== ag2.data) return false;
  if (ag1.status === 'cancelado' || ag2.status === 'cancelado') return false;
  
  const duracao1 = DURACAO_POR_PROCEDIMENTO[ag1.procedimento_nome] || 30;
  const duracao2 = DURACAO_POR_PROCEDIMENTO[ag2.procedimento_nome] || 30;
  
  const inicio1 = horarioParaMinutos(ag1.horario);
  const fim1 = inicio1 + duracao1;
  const inicio2 = horarioParaMinutos(ag2.horario);
  const fim2 = inicio2 + duracao2;
  
  return (inicio1 < fim2 && inicio2 < fim1);
};

// Verificar se um novo horário está disponível
const isHorarioDisponivel = (agendamentosExistentes, novoAgendamento, idIgnorar = null) => {
  for (const ag of agendamentosExistentes) {
    if (ag.id === idIgnorar) continue;
    if (verificarConflito(ag, novoAgendamento)) {
      return { disponivel: false, conflitoCom: ag };
    }
  }
  return { disponivel: true, conflitoCom: null };
};

export default function CalendarioInterativo({ 
  agendamentos = [], 
  dentistas = [], 
  procedimentos = [],
  salas = ['01', '02', '03'],
  visualizacao = 'semanal',
  onAgendamentoClick,
  onAgendamentoMove,
  onAgendamentoEdit,
  onAgendamentoDelete 
}) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [zoom, setZoom] = useState(1);
  const [filtroDentista, setFiltroDentista] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroSala, setFiltroSala] = useState('todas');
  const [modoEdicao, setModoEdicao] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [dragOverHorario, setDragOverHorario] = useState(null);

  // Obter dias da semana
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    d.setDate(d.getDate() - diff);
    return d;
  };

  const startOfWeek = getStartOfWeek(dataAtual);
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  // Filtrar agendamentos
  const filtrarAgendamentos = (ag) => {
    if (filtroDentista !== 'todos' && ag.dentista_nome !== filtroDentista) return false;
    if (filtroStatus !== 'todos' && ag.status !== filtroStatus) return false;
    if (filtroSala !== 'todas' && ag.sala !== filtroSala) return false;
    return true;
  };

  const getAgendamentosPorDiaESala = (dia, sala) => {
    const dataStr = dia.toISOString().split('T')[0];
    return agendamentos.filter(ag => 
      ag.data === dataStr && 
      ag.sala === sala && 
      filtrarAgendamentos(ag)
    );
  };

  // Verificar se um horário está ocupado em uma sala específica
  const isHorarioOcupado = (dia, sala, horario, idIgnorar = null) => {
    const dataStr = dia.toISOString().split('T')[0];
    const horarioMinutos = horarioParaMinutos(horario);
    
    for (const ag of agendamentos) {
      if (ag.id === idIgnorar) continue;
      if (ag.data !== dataStr) continue;
      if (ag.sala !== sala) continue;
      if (ag.status === 'cancelado') continue;
      
      const duracao = DURACAO_POR_PROCEDIMENTO[ag.procedimento_nome] || 30;
      const inicio = horarioParaMinutos(ag.horario);
      const fim = inicio + duracao;
      
      if (horarioMinutos >= inicio && horarioMinutos < fim) {
        return true;
      }
    }
    return false;
  };

  // Obter agendamento que ocupa um horário específico
  const getAgendamentoNoHorario = (dia, sala, horario) => {
    const dataStr = dia.toISOString().split('T')[0];
    const horarioMinutos = horarioParaMinutos(horario);
    
    for (const ag of agendamentos) {
      if (ag.data !== dataStr) continue;
      if (ag.sala !== sala) continue;
      if (ag.status === 'cancelado') continue;
      
      const duracao = DURACAO_POR_PROCEDIMENTO[ag.procedimento_nome] || 30;
      const inicio = horarioParaMinutos(ag.horario);
      const fim = inicio + duracao;
      
      if (horarioMinutos >= inicio && horarioMinutos < fim) {
        return ag;
      }
    }
    return null;
  };

  // Calcular altura do card baseado na duração
  const getCardHeight = (procedimentoNome) => {
    const duracao = DURACAO_POR_PROCEDIMENTO[procedimentoNome] || 30;
    // Altura base: 60px para 30 minutos, proporcional
    return Math.min(120, (duracao / 30) * 60);
  };

  // Drag & Drop com validação
  const handleDragStart = (agendamento, e) => {
    if (!modoEdicao) {
      e.preventDefault();
      showToast('Ative o modo edição para mover agendamentos', 'info');
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify(agendamento));
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDragOverHorario(null);
  };

  const handleDragOver = (e, dia, horario, sala) => {
    e.preventDefault();
    setDragOverHorario({ dia, horario, sala });
  };

  const handleDragLeave = () => {
    setDragOverHorario(null);
  };

  const handleDrop = async (e, dia, horario, sala) => {
    e.preventDefault();
    setDragOverHorario(null);
    
    if (!modoEdicao) return;
    
    const agendamentoOriginal = JSON.parse(e.dataTransfer.getData('text/plain'));
    const novaData = dia.toISOString().split('T')[0];
    const duracao = DURACAO_POR_PROCEDIMENTO[agendamentoOriginal.procedimento_nome] || 30;
    
    // Verificar conflito
    const novoAgendamento = {
      ...agendamentoOriginal,
      data: novaData,
      horario: horario,
      sala: sala,
      procedimento_nome: agendamentoOriginal.procedimento_nome
    };
    
    const { disponivel, conflitoCom } = isHorarioDisponivel(agendamentos, novoAgendamento, agendamentoOriginal.id);
    
    if (!disponivel) {
      showToast(`⚠️ Conflito: Sala ${sala} já ocupada por ${conflitoCom?.paciente_nome} (${conflitoCom?.horario} - ${calcularHorarioFim(conflitoCom?.horario, DURACAO_POR_PROCEDIMENTO[conflitoCom?.procedimento_nome] || 30)})`, 'error');
      return;
    }
    
    const agendamentoAtualizado = {
      ...agendamentoOriginal,
      data: novaData,
      horario: horario,
      sala: sala,
      duracao_procedimento: duracao
    };
    
    onAgendamentoMove?.(agendamentoAtualizado);
    showToast(`✅ Agendamento movido para ${horario} - Sala ${sala} (${duracao}min)`, 'success');
  };

  // Navegação
  const hoje = () => setDataAtual(new Date());
  const semanaAnterior = () => {
    const newDate = new Date(dataAtual);
    newDate.setDate(dataAtual.getDate() - 7);
    setDataAtual(newDate);
  };
  const proximaSemana = () => {
    const newDate = new Date(dataAtual);
    newDate.setDate(dataAtual.getDate() + 7);
    setDataAtual(newDate);
  };

  const formatarData = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatarDataCompleta = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isHoje = (date) => {
    const hoje = new Date();
    return date.toDateString() === hoje.toDateString();
  };

  // Salas a serem exibidas
  const salasExibidas = filtroSala === 'todas' ? salas : [filtroSala];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-1">
            <button onClick={semanaAnterior} className="p-1.5 hover:bg-white rounded-lg transition">
              <ChevronLeft size={18} />
            </button>
            <button onClick={hoje} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Hoje
            </button>
            <button onClick={proximaSemana} className="p-1.5 hover:bg-white rounded-lg transition">
              <ChevronRight size={18} />
            </button>
            <span className="text-sm font-bold ml-2">
              {formatarData(diasSemana[0])} - {formatarData(diasSemana[6])}
            </span>
          </div>
          
          <div className="flex gap-1">
            <div className="flex items-center gap-0.5 bg-white rounded-lg shadow-sm px-1">
              <button onClick={() => setZoom(Math.max(0.7, zoom - 0.1))} className="p-1 hover:bg-gray-100 rounded"><ZoomOut size={14} /></button>
              <span className="text-[10px] font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-1 hover:bg-gray-100 rounded"><ZoomIn size={14} /></button>
            </div>
            
            <button onClick={() => setModoEdicao(!modoEdicao)} className={`px-2 py-1 text-xs rounded-lg transition flex items-center gap-1 ${modoEdicao ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <Edit size={12} /> {modoEdicao ? 'Edição Ativa' : 'Mover'}
            </button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mt-2">
          <select value={filtroDentista} onChange={(e) => setFiltroDentista(e.target.value)} className="px-2 py-0.5 text-[10px] border rounded-lg">
            <option value="todos">Todos dentistas</option>
            {dentistas.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
          </select>
          
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-2 py-0.5 text-[10px] border rounded-lg">
            <option value="todos">Todos status</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => <option key={key} value={key}>{config.icon} {config.label}</option>)}
          </select>
          
          <select value={filtroSala} onChange={(e) => setFiltroSala(e.target.value)} className="px-2 py-0.5 text-[10px] border rounded-lg">
            <option value="todas">Todas salas</option>
            {salas.map(s => <option key={s} value={s}>Sala {s}</option>)}
          </select>
        </div>
      </div>

      {/* Calendário */}
      <div className="overflow-x-auto" style={{ fontSize: `${0.8 * zoom}rem` }}>
        <div className="min-w-[900px]">
          {/* Cabeçalho com dias e salas */}
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(${salasExibidas.length}, 1fr)` }}>
            <div className="p-2 border-b bg-gray-50 font-semibold text-xs sticky left-0 z-10 text-center">Horário</div>
            {salasExibidas.map(sala => (
              <div key={sala} className="p-2 border-b border-l bg-gray-50 font-semibold text-xs text-center">
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700">Sala {sala}</span>
              </div>
            ))}
            
            {/* Para cada horário */}
            {TODOS_HORARIOS.map(horario => (
              <React.Fragment key={horario}>
                <div className="p-1 border-b text-[10px] text-gray-500 text-right pr-2 bg-gray-50 sticky left-0 z-10 font-mono">
                  {horario}
                </div>
                {salasExibidas.map(sala => (
                  <div 
                    key={`${sala}-${horario}`}
                    onDragOver={(e) => handleDragOver(e, dataAtual, horario, sala)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dataAtual, horario, sala)}
                    className={`border-b border-l p-0.5 min-h-[60px] transition relative
                      ${dragOverHorario?.horario === horario && dragOverHorario?.sala === sala ? 'bg-green-100 border-2 border-green-400' : 'hover:bg-blue-50'}
                    `}
                  >
                    {/* Mostrar agendamentos para cada dia da semana */}
                    {diasSemana.map((dia, idx) => {
                      const agendamento = getAgendamentoNoHorario(dia, sala, horario);
                      if (!agendamento) return null;
                      
                      const duracao = DURACAO_POR_PROCEDIMENTO[agendamento.procedimento_nome] || 30;
                      const altura = getCardHeight(agendamento.procedimento_nome);
                      const ePrimeiroSlot = horario === agendamento.horario;
                      
                      if (!ePrimeiroSlot) return null;
                      
                      return (
                        <div
                          key={`${agendamento.id}-${idx}`}
                          draggable={modoEdicao}
                          onDragStart={(e) => handleDragStart(agendamento, e)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            setAgendamentoSelecionado(agendamento);
                            setShowDetalhes(true);
                          }}
                          className={`${STATUS_CONFIG[agendamento.status]?.bg} border-l-4 ${STATUS_CONFIG[agendamento.status]?.border} rounded-md p-1 text-[10px] cursor-pointer hover:shadow-md transition ${modoEdicao ? 'cursor-move' : 'cursor-pointer'} relative z-10`}
                          style={{ 
                            minHeight: `${altura}px`,
                            height: `${altura}px`,
                            overflow: 'hidden'
                          }}
                        >
                          <div className="font-semibold truncate text-xs">{agendamento.paciente_nome}</div>
                          <div className="text-gray-500 truncate text-[9px]">{agendamento.procedimento_nome}</div>
                          <div className="flex justify-between mt-0.5 text-gray-400 text-[8px]">
                            <span>{agendamento.dentista_nome?.split(' ')[0]}</span>
                            <span>{duracao}min</span>
                          </div>
                          <div className="absolute bottom-0 right-0 text-[8px] text-gray-400 bg-white bg-opacity-50 px-1 rounded">
                            {calcularHorarioFim(agendamento.horario, duracao)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="p-2 border-t bg-gray-50 text-[10px] text-gray-400 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>💡 Dica: Ative o modo edição para mover agendamentos</span>
          <span>⏰ Cards mostram horário de término</span>
        </div>
        <div className="flex gap-3">
          {Object.entries(STATUS_CONFIG).slice(0, 4).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${config.bg} border-l-2 ${config.border}`}></div>
              <span>{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetalhes && agendamentoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetalhes(false)}>
          <div className="bg-white rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border-b ${STATUS_CONFIG[agendamentoSelecionado.status]?.bg} rounded-t-xl`}>
              <div className="flex justify-between items-center">
                <h3 className="font-bold">{agendamentoSelecionado.paciente_nome}</h3>
                <button onClick={() => setShowDetalhes(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Data:</span> {new Date(agendamentoSelecionado.data).toLocaleDateString('pt-BR')}</div>
                <div><span className="text-gray-500">Horário:</span> {agendamentoSelecionado.horario}</div>
                <div><span className="text-gray-500">Término:</span> {calcularHorarioFim(agendamentoSelecionado.horario, DURACAO_POR_PROCEDIMENTO[agendamentoSelecionado.procedimento_nome] || 30)}</div>
                <div><span className="text-gray-500">Duração:</span> {DURACAO_POR_PROCEDIMENTO[agendamentoSelecionado.procedimento_nome] || 30} min</div>
                <div><span className="text-gray-500">Procedimento:</span> {agendamentoSelecionado.procedimento_nome}</div>
                <div><span className="text-gray-500">Dentista:</span> {agendamentoSelecionado.dentista_nome}</div>
                <div><span className="text-gray-500">Sala:</span> {agendamentoSelecionado.sala}</div>
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => { onAgendamentoEdit?.(agendamentoSelecionado); setShowDetalhes(false); }} className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-sm">Editar</button>
              <button onClick={() => { onAgendamentoDelete?.(agendamentoSelecionado.id); setShowDetalhes(false); }} className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
