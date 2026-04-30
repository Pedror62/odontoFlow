import React, { useState, useEffect } from 'react';
import { 
  Clock, Stethoscope, User, Activity, CheckCircle, XCircle, 
  AlertCircle, Calendar, ChevronLeft, ChevronRight, 
  Filter, Download, Printer, Eye, Edit, Trash2, 
  MoreVertical, MapPin, Phone, Mail, DollarSign,
  Plus, Minus, ZoomIn, ZoomOut, RefreshCw, X
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

// Gerar horários (08:00 às 20:00)
const HORARIOS = [];
for (let i = 8; i <= 20; i++) {
  HORARIOS.push(`${i.toString().padStart(2, '0')}:00`);
  HORARIOS.push(`${i.toString().padStart(2, '0')}:30`);
}

export default function CalendarioInterativo({ 
  agendamentos, 
  dentistas, 
  salas = ['01', '02', '03'],
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

  // Obter data de início da semana (segunda-feira)
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
    let filtrados = [...(agendamentos || [])];
    
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

  // Drag & Drop
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

  const handleDrop = (data, horario, sala, e) => {
    e.preventDefault();
    if (!modoEdicao) {
      showToast('Ative o modo edição para mover agendamentos', 'info');
      return;
    }
    
    const agendamentoOriginal = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    const conflito = getAgendamentoNoHorario(
      getAgendamentosPorDiaESala(data, sala),
      horario
    );
    
    if (conflito && conflito.id !== agendamentoOriginal.id) {
      showToast(`⚠️ Horário ocupado por ${conflito.paciente_nome}`, 'error');
      return;
    }
    
    const agendamentoAtualizado = {
      ...agendamentoOriginal,
      data: data.toISOString().split('T')[0],
      horario: horario,
      sala: sala
    };
    
    onAgendamentoMove?.(agendamentoAtualizado);
    showToast(`✅ Agendamento movido para ${horario} - Sala ${sala}`, 'success');
  };

  // Navegação
  const hoje = () => {
    setDataAtual(new Date());
  };

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

  // Estatísticas da semana
  const estatisticasSemana = () => {
    let total = 0;
    for (const dia of diasSemana) {
      for (const sala of salas) {
        total += getAgendamentosPorDiaESala(dia, sala).length;
      }
    }
    
    const porStatus = {};
    for (const ag of (agendamentos || [])) {
      if (diasSemana.some(dia => dia.toISOString().split('T')[0] === ag.data)) {
        porStatus[ag.status] = (porStatus[ag.status] || 0) + 1;
      }
    }
    
    return { total, porStatus };
  };

  const stats = estatisticasSemana();

  const formatarData = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const isHoje = (date) => {
    const hoje = new Date();
    return date.toDateString() === hoje.toDateString();
  };

  // Dicas de produtividade
  const dicas = [
    { icone: '💡', texto: 'Arraste os cards para remarcar consultas' },
    { icone: '🎯', texto: 'Use filtros para visualizar apenas um dentista' },
    { icone: '⚡', texto: 'Ative o modo edição para mover agendamentos' },
    { icone: '📅', texto: 'Clique em um card para ver detalhes completos' },
    { icone: '🔍', texto: 'Use o zoom para melhor visualização' }
  ];
  const [dicaAtual, setDicaAtual] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDicaAtual((prev) => (prev + 1) % dicas.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header com controles avançados */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={semanaAnterior}
              className="p-2 hover:bg-white rounded-lg transition shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={hoje}
              className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Hoje
            </button>
            <button 
              onClick={proximaSemana}
              className="p-2 hover:bg-white rounded-lg transition shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
            <h2 className="text-lg font-bold ml-2">
              {formatarData(diasSemana[0])} - {formatarData(diasSemana[6])}
            </h2>
          </div>
          
          <div className="flex gap-2">
            {/* Zoom */}
            <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm px-2">
              <button onClick={() => setZoom(Math.max(0.8, zoom - 0.1))} className="p-1 hover:bg-gray-100 rounded">
                <ZoomOut size={16} />
              </button>
              <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-1 hover:bg-gray-100 rounded">
                <ZoomIn size={16} />
              </button>
            </div>
            
            {/* Modo Edição */}
            <button
              onClick={() => setModoEdicao(!modoEdicao)}
              className={`px-3 py-1.5 text-sm rounded-lg transition shadow-sm flex items-center gap-1 ${
                modoEdicao ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Edit size={14} />
              {modoEdicao ? 'Edição Ativa' : 'Modo Edição'}
            </button>
          </div>
        </div>
        
        {/* Filtros e Estatísticas */}
        <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
          <div className="flex gap-2">
            <select
              value={filtroDentista}
              onChange={(e) => setFiltroDentista(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="todos">👨‍⚕️ Todos dentistas</option>
              {dentistas?.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
            </select>
            
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="todos">📋 Todos status</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.icon} {config.label}</option>
              ))}
            </select>
            
            <select
              value={filtroSala}
              onChange={(e) => setFiltroSala(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="todas">🚪 Todas salas</option>
              {salas.map(s => <option key={s} value={s}>Sala {s}</option>)}
            </select>
          </div>
          
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full">
              <Activity size={14} /> {stats.total} consultas
            </div>
            <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              <Calendar size={14} /> {agendamentos?.length || 0} total
            </div>
          </div>
        </div>
      </div>

      {/* Calendário Principal com Zoom */}
      <div className="overflow-x-auto" style={{ fontSize: `${0.875 * zoom}rem` }}>
        <div className="min-w-[1000px]">
          {/* Cabeçalho com dias */}
          <div className="grid" style={{ gridTemplateColumns: `100px repeat(${salas.length}, 1fr)` }}>
            <div className="p-3 border-b bg-gray-50 font-semibold text-sm sticky left-0 z-10">Horário</div>
            {salas.map(sala => (
              <div key={sala} className="p-3 border-b border-l bg-gray-50 font-semibold text-sm text-center">
                <div className={`inline-block px-3 py-1 rounded-full ${SALA_COLORS[sala]?.bg || 'bg-gray-100'} ${SALA_COLORS[sala]?.text || 'text-gray-700'}`}>
                  🚪 Sala {sala}
                </div>
              </div>
            ))}
            
            {/* Linhas de horário */}
            {HORARIOS.map(horario => (
              <React.Fragment key={horario}>
                <div className="p-2 border-b text-xs text-gray-500 text-right pr-3 bg-gray-50 sticky left-0 z-10 font-mono">
                  {horario}
                </div>
                {salas.map(sala => {
                  return (
                    <div 
                      key={`${sala}-${horario}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(dataAtual, horario, sala, e)}
                      className="border-b border-l p-1 min-h-[70px] cursor-pointer hover:bg-blue-50 transition relative group"
                    >
                      {/* Mostrar agendamentos do dia */}
                      {diasSemana.map((dia, idx) => {
                        const agendamento = getAgendamentoNoHorario(
                          getAgendamentosPorDiaESala(dia, sala),
                          horario
                        );
                        if (!agendamento) return null;
                        
                        const isDiaHoje = isHoje(dia);
                        
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
                            className={`${STATUS_CONFIG[agendamento.status]?.bg || STATUS_CONFIG.agendado.bg} 
                              border-l-4 ${STATUS_CONFIG[agendamento.status]?.border || STATUS_CONFIG.agendado.border} 
                              rounded-lg p-2 text-xs cursor-pointer hover:shadow-md transition-all 
                              ${modoEdicao ? 'cursor-move' : 'cursor-pointer'}
                              mb-1 relative
                              ${isDiaHoje ? 'ring-1 ring-blue-300' : ''}`}
                            style={{ 
                              transform: `scale(1)`,
                              transition: 'all 0.2s'
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-semibold truncate">{agendamento.paciente_nome}</span>
                              <span className="text-[10px] opacity-70">{STATUS_CONFIG[agendamento.status]?.icon}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                              <Stethoscope size={10} />
                              <span className="truncate">{agendamento.procedimento_nome}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1 text-[10px] text-gray-400">
                              <span>{agendamento.dentista_nome?.split(' ')[0]}</span>
                              <span>{formatarData(dia)}</span>
                            </div>
                            {isDiaHoje && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            {modoEdicao && (
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
                                <span className="text-[10px] bg-gray-800 text-white px-1 rounded-full">⋮⋮</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Dicas de produtividade - Rodapé */}
      <div className="p-3 border-t bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-gray-400">💡 Dica:</span>
            <span className="text-gray-600">
              {dicas[dicaAtual].icone} {dicas[dicaAtual].texto}
            </span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 rounded border-l-2 border-blue-500"></div>
              <span className="text-[10px]">Agendado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 rounded border-l-2 border-green-500"></div>
              <span className="text-[10px]">Confirmado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-100 rounded border-l-2 border-yellow-500"></div>
              <span className="text-[10px]">Em andamento</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-100 rounded border-l-2 border-orange-500"></div>
              <span className="text-[10px]">Pausado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded border-l-2 border-gray-500"></div>
              <span className="text-[10px]">Concluído</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Agendamento */}
      {showDetalhes && agendamentoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className={`p-5 border-b ${STATUS_CONFIG[agendamentoSelecionado.status]?.bg || 'bg-gray-50'} rounded-t-2xl`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{STATUS_CONFIG[agendamentoSelecionado.status]?.icon}</span>
                  <h2 className="text-xl font-bold">{agendamentoSelecionado.paciente_nome}</h2>
                </div>
                <button onClick={() => setShowDetalhes(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {STATUS_CONFIG[agendamentoSelecionado.status]?.label}
              </p>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 uppercase">Data</p>
                  <p className="font-medium">{new Date(agendamentoSelecionado.data).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 uppercase">Horário</p>
                  <p className="font-medium">{agendamentoSelecionado.horario}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase flex items-center gap-1"><Stethoscope size={12} /> Procedimento</p>
                <p className="font-medium">{agendamentoSelecionado.procedimento_nome}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase flex items-center gap-1"><User size={12} /> Dentista</p>
                <p className="font-medium">{agendamentoSelecionado.dentista_nome}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase flex items-center gap-1"><MapPin size={12} /> Sala</p>
                <p className="font-medium">Sala {agendamentoSelecionado.sala}</p>
              </div>
              
              {agendamentoSelecionado.valor_final && (
                <div className="bg-green-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 uppercase flex items-center gap-1"><DollarSign size={12} /> Valor</p>
                  <p className="font-medium text-green-600">R$ {agendamentoSelecionado.valor_final.toFixed(2)}</p>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t bg-gray-50 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => {
                  onAgendamentoEdit?.(agendamentoSelecionado);
                  setShowDetalhes(false);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Edit size={16} /> Editar
              </button>
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
                    onAgendamentoDelete?.(agendamentoSelecionado.id);
                    setShowDetalhes(false);
                  }
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
