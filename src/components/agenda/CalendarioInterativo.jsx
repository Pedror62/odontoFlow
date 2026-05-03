import React, { useState, useEffect } from 'react';
import { 
  Clock, Stethoscope, User, Activity, CheckCircle, XCircle, 
  AlertCircle, Calendar, ChevronLeft, ChevronRight, 
  Filter, Download, Printer, Eye, Edit, Trash2, 
  MoreVertical, MapPin, Phone, Mail, DollarSign,
  Plus, Minus, ZoomIn, ZoomOut, RefreshCw, X, AlertTriangle
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

// Cores das salas
const SALA_COLORS = {
  '01': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  '02': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  '03': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' }
};

// Gerar horários base (08:00 às 20:00)
const HORARIOS_BASE = [];
for (let i = 8; i <= 20; i++) {
  HORARIOS_BASE.push(`${i.toString().padStart(2, '0')}:00`);
  HORARIOS_BASE.push(`${i.toString().padStart(2, '0')}:30`);
}

// Função para calcular horários disponíveis baseado na duração do procedimento
const calcularHorariosDisponiveis = (procedimentoDuracao, horarioInicioDisponivel = '08:00') => {
  const horarios = [];
  const duracaoMinutos = procedimentoDuracao || 30;
  const blocosPorHora = 60 / duracaoMinutos;
  
  for (let i = 8; i <= 20; i++) {
    for (let j = 0; j < blocosPorHora; j++) {
      const minutos = j * duracaoMinutos;
      if (minutos < 60) {
        const horario = `${i.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        if (horario >= horarioInicioDisponivel) {
          horarios.push(horario);
        }
      }
    }
  }
  return horarios;
};

// Função para verificar conflito de horário considerando a duração
const verificarConflitoHorario = (agendamentosExistentes, novaData, novoSala, novoHorario, duracaoMinutos, idIgnorar = null) => {
  const novoInicio = converterHorarioParaMinutos(novoHorario);
  const novoFim = novoInicio + duracaoMinutos;
  
  for (const ag of agendamentosExistentes) {
    if (ag.id === idIgnorar) continue;
    if (ag.data !== novaData) continue;
    if (ag.sala !== novoSala) continue;
    if (ag.status === 'cancelado') continue;
    
    const agInicio = converterHorarioParaMinutos(ag.horario);
    const agDuracao = ag.duracao_procedimento || 30;
    const agFim = agInicio + agDuracao;
    
    // Verifica sobreposição
    if (novoInicio < agFim && novoFim > agInicio) {
      return {
        conflito: true,
        com: ag,
        mensagem: `Conflito com ${ag.paciente_nome} das ${ag.horario} às ${formatarMinutosParaHorario(agFim)}`
      };
    }
  }
  
  return { conflito: false };
};

// Funções auxiliares para conversão de horário
const converterHorarioParaMinutos = (horario) => {
  const [hora, minuto] = horario.split(':').map(Number);
  return hora * 60 + minuto;
};

const formatarMinutosParaHorario = (minutosTotais) => {
  const hora = Math.floor(minutosTotais / 60);
  const minuto = minutosTotais % 60;
  return `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
};

// Obter duração do procedimento pelo nome
const getDuracaoProcedimento = (procedimentoNome, procedimentos) => {
  const proc = procedimentos?.find(p => p.nome === procedimentoNome);
  return proc?.duracao || 30;
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
  onAgendamentoDelete,
  onStatusChange 
}) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [zoom, setZoom] = useState(1);
  const [filtroDentista, setFiltroDentista] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroSala, setFiltroSala] = useState('todas');
  const [modoEdicao, setModoEdicao] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState(HORARIOS_BASE);

  // Atualizar horários disponíveis baseado nos procedimentos
  useEffect(() => {
    if (agendamentoSelecionado) {
      const duracao = getDuracaoProcedimento(agendamentoSelecionado.procedimento_nome, procedimentos);
      setHorariosDisponiveis(calcularHorariosDisponiveis(duracao));
    }
  }, [agendamentoSelecionado, procedimentos]);

  // Obter data de início da semana
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
  const getAgendamentosFiltrados = () => {
    let filtrados = [...agendamentos];
    
    if (filtroDentista !== 'todos') {
      filtrados = filtrados.filter(ag => ag.dentista_nome === filtroDentista);
    }
    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(ag => ag.status === filtroStatus);
    }
    if (filtroSala !== 'todas') {
      filtrados = filtrados.filter(ag => ag.sala === filtroSala);
    }
    
    return filtrados;
  };

  const getAgendamentosPorDiaESala = (data, sala) => {
    const dataStr = data.toISOString().split('T')[0];
    const filtrados = getAgendamentosFiltrados();
    return filtrados.filter(ag => ag.data === dataStr && ag.sala === sala);
  };

  const getAgendamentoNoHorario = (agendamentosDia, horario) => {
    return agendamentosDia.find(ag => ag.horario === horario);
  };

  // Verificar se um horário está disponível para um procedimento específico
  const isHorarioDisponivel = (data, sala, horario, procedimentoNome, idIgnorar = null) => {
    const duracao = getDuracaoProcedimento(procedimentoNome, procedimentos);
    const conflito = verificarConflitoHorario(agendamentos, data, sala, horario, duracao, idIgnorar);
    return !conflito.conflito;
  };

  // Drag & Drop com validação de duração
  const handleDragStart = (agendamento, e) => {
    if (!modoEdicao) return;
    e.dataTransfer.setData('text/plain', JSON.stringify(agendamento));
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (data, horario, sala, e) => {
    e.preventDefault();
    if (!modoEdicao) {
      showToast('Ative o modo edição para mover agendamentos', 'info');
      return;
    }
    
    const agendamentoOriginal = JSON.parse(e.dataTransfer.getData('text/plain'));
    const duracao = getDuracaoProcedimento(agendamentoOriginal.procedimento_nome, procedimentos);
    
    // Verificar conflito de horário
    const conflito = verificarConflitoHorario(
      agendamentos, 
      data.toISOString().split('T')[0], 
      sala, 
      horario, 
      duracao,
      agendamentoOriginal.id
    );
    
    if (conflito.conflito) {
      showToast(`⚠️ ${conflito.mensagem}`, 'error');
      return;
    }
    
    const agendamentoAtualizado = {
      ...agendamentoOriginal,
      data: data.toISOString().split('T')[0],
      horario: horario,
      sala: sala,
      duracao_procedimento: duracao
    };
    
    onAgendamentoMove?.(agendamentoAtualizado);
    showToast(`✅ Agendamento movido para ${horario} - Sala ${sala} (${duracao} min)`, 'success');
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
  const diaAnterior = () => {
    const newDate = new Date(dataAtual);
    newDate.setDate(dataAtual.getDate() - 1);
    setDataAtual(newDate);
  };
  const proximoDia = () => {
    const newDate = new Date(dataAtual);
    newDate.setDate(dataAtual.getDate() + 1);
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

  // Estatísticas da semana
  const estatisticasSemana = () => {
    let total = 0;
    for (const dia of diasSemana) {
      for (const sala of salas) {
        total += getAgendamentosPorDiaESala(dia, sala).length;
      }
    }
    return total;
  };

  // Dicas de produtividade
  const dicas = [
    { icone: '💡', texto: 'Arraste os cards para remarcar consultas' },
    { icone: '🎯', texto: 'Use filtros para visualizar apenas um dentista' },
    { icone: '⚡', texto: 'Ative o modo edição para mover agendamentos' },
    { icone: '⏰', texto: 'O sistema respeita a duração de cada procedimento' },
    { icone: '🚫', texto: 'Conflitos de horário são bloqueados automaticamente' }
  ];
  const [dicaAtual, setDicaAtual] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDicaAtual((prev) => (prev + 1) % dicas.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header com controles */}
      <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-1">
            <button onClick={visualizacao === 'semanal' ? semanaAnterior : diaAnterior} className="p-1.5 hover:bg-white rounded-lg transition">
              <ChevronLeft size={18} />
            </button>
            <button onClick={hoje} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Hoje
            </button>
            <button onClick={visualizacao === 'semanal' ? proximaSemana : proximoDia} className="p-1.5 hover:bg-white rounded-lg transition">
              <ChevronRight size={18} />
            </button>
            <span className="text-sm font-bold ml-2">
              {visualizacao === 'semanal' 
                ? `${formatarData(diasSemana[0])} - ${formatarData(diasSemana[6])}`
                : formatarDataCompleta(dataAtual)}
            </span>
          </div>
          
          <div className="flex gap-1">
            <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
              <button onClick={() => setVisualizacao('semanal')} className={`px-2 py-1 text-xs transition ${visualizacao === 'semanal' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>Semana</button>
              <button onClick={() => setVisualizacao('diaria')} className={`px-2 py-1 text-xs transition ${visualizacao === 'diaria' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>Dia</button>
            </div>
            
            <div className="flex items-center gap-0.5 bg-white rounded-lg shadow-sm px-1">
              <button onClick={() => setZoom(Math.max(0.7, zoom - 0.1))} className="p-1 hover:bg-gray-100 rounded"><ZoomOut size={14} /></button>
              <span className="text-[10px] font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-1 hover:bg-gray-100 rounded"><ZoomIn size={14} /></button>
            </div>
            
            <button onClick={() => setModoEdicao(!modoEdicao)} className={`px-2 py-1 text-xs rounded-lg transition flex items-center gap-1 ${modoEdicao ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <Edit size={12} /> {modoEdicao ? 'Edição' : 'Mover'}
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
          
          <span className="text-[10px] text-gray-400 ml-auto">📊 {estatisticasSemana()} consultas esta semana</span>
        </div>
      </div>

      {/* Calendário */}
      <div className="overflow-x-auto" style={{ fontSize: `${0.8 * zoom}rem` }}>
        <div className="min-w-[900px]">
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(${salas.length}, 1fr)` }}>
            <div className="p-2 border-b bg-gray-50 font-semibold text-xs sticky left-0 z-10 text-center">Horário</div>
            {salas.map(sala => (
              <div key={sala} className="p-2 border-b border-l bg-gray-50 font-semibold text-xs text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${SALA_COLORS[sala]?.bg || 'bg-gray-100'}`}>Sala {sala}</span>
              </div>
            ))}
            
            {HORARIOS_BASE.map(horario => (
              <React.Fragment key={horario}>
                <div className="p-1 border-b text-[10px] text-gray-500 text-right pr-2 bg-gray-50 sticky left-0 z-10 font-mono">
                  {horario}
                </div>
                {salas.map(sala => {
                  if (visualizacao === 'semanal') {
                    return (
                      <div key={`${sala}-${horario}`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(dataAtual, horario, sala, e)} className="border-b border-l p-0.5 min-h-[60px] hover:bg-blue-50 transition">
                        {diasSemana.map((dia, idx) => {
                          const agendamento = getAgendamentoNoHorario(getAgendamentosPorDiaESala(dia, sala), horario);
                          if (!agendamento) return null;
                          const duracao = getDuracaoProcedimento(agendamento.procedimento_nome, procedimentos);
                          const altura = Math.min(60, duracao / 30 * 60);
                          return (
                            <div key={`${agendamento.id}-${idx}`} draggable={modoEdicao} onDragStart={(e) => handleDragStart(agendamento, e)} onDragEnd={handleDragEnd} onClick={() => { setAgendamentoSelecionado(agendamento); setShowDetalhes(true); }} className={`${STATUS_CONFIG[agendamento.status]?.bg} border-l-4 ${STATUS_CONFIG[agendamento.status]?.border} rounded-md p-1 text-[10px] cursor-pointer hover:shadow-md transition ${modoEdicao ? 'cursor-move' : 'cursor-pointer'} mb-0.5 relative`} style={{ minHeight: `${altura}px` }}>
                              <div className="font-semibold truncate">{agendamento.paciente_nome}</div>
                              <div className="text-gray-500 truncate">{agendamento.procedimento_nome?.substring(0, 15)}</div>
                              <div className="flex justify-between mt-0.5 text-gray-400">
                                <span>{agendamento.dentista_nome?.split(' ')[0]}</span>
                                <span>{duracao}min</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  } else {
                    const agendamento = getAgendamentoNoHorario(getAgendamentosPorDiaESala(dataAtual, sala), horario);
                    return (
                      <div key={`${sala}-${horario}`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(dataAtual, horario, sala, e)} className="border-b border-l p-0.5 min-h-[60px] hover:bg-blue-50 transition">
                        {agendamento && (
                          <div draggable={modoEdicao} onDragStart={(e) => handleDragStart(agendamento, e)} onDragEnd={handleDragEnd} onClick={() => { setAgendamentoSelecionado(agendamento); setShowDetalhes(true); }} className={`${STATUS_CONFIG[agendamento.status]?.bg} border-l-4 ${STATUS_CONFIG[agendamento.status]?.border} rounded-md p-1 text-[10px] cursor-pointer hover:shadow-md transition h-full flex flex-col justify-between`}>
                            <div>
                              <div className="font-semibold truncate">{agendamento.paciente_nome}</div>
                              <div className="text-gray-500 truncate">{agendamento.procedimento_nome}</div>
                            </div>
                            <div className="flex justify-between mt-1 text-gray-400">
                              <span>{agendamento.dentista_nome?.split(' ')[0]}</span>
                              <span>{getDuracaoProcedimento(agendamento.procedimento_nome, procedimentos)}min</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Dica rodapé */}
      <div className="p-2 border-t bg-gradient-to-r from-gray-50 to-white text-center text-[10px] text-gray-400">
        {dicas[dicaAtual].icone} {dicas[dicaAtual].texto}
      </div>

      {/* Modal de Detalhes */}
      {showDetalhes && agendamentoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetalhes(false)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border-b ${STATUS_CONFIG[agendamentoSelecionado.status]?.bg} rounded-t-xl`}>
              <div className="flex justify-between items-center">
                <h3 className="font-bold">{agendamentoSelecionado.paciente_nome}</h3>
                <button onClick={() => setShowDetalhes(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <p className="text-xs text-gray-500">{STATUS_CONFIG[agendamentoSelecionado.status]?.label}</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Data:</span> {new Date(agendamentoSelecionado.data).toLocaleDateString('pt-BR')}</div>
                <div><span className="text-gray-500">Horário:</span> {agendamentoSelecionado.horario}</div>
                <div><span className="text-gray-500">Procedimento:</span> {agendamentoSelecionado.procedimento_nome}</div>
                <div><span className="text-gray-500">Dentista:</span> {agendamentoSelecionado.dentista_nome}</div>
                <div><span className="text-gray-500">Sala:</span> {agendamentoSelecionado.sala}</div>
                <div><span className="text-gray-500">Duração:</span> {getDuracaoProcedimento(agendamentoSelecionado.procedimento_nome, procedimentos)} minutos</div>
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
