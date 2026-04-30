import React, { useState } from 'react';
import { Clock, Stethoscope, User, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { showToast } from '../Toast';

// Cores por status
const STATUS_COLORS = {
  agendado: 'bg-blue-100 border-l-4 border-blue-500 text-blue-800',
  confirmado: 'bg-green-100 border-l-4 border-green-500 text-green-800',
  em_andamento: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800',
  concluido: 'bg-gray-100 border-l-4 border-gray-500 text-gray-600',
  cancelado: 'bg-red-100 border-l-4 border-red-500 text-red-800 line-through',
  pausado: 'bg-orange-100 border-l-4 border-orange-500 text-orange-800'
};

const HORARIOS = [];
for (let i = 8; i <= 20; i++) {
  HORARIOS.push(`${i.toString().padStart(2, '0')}:00`);
  HORARIOS.push(`${i.toString().padStart(2, '0')}:30`);
}

export default function CalendarioInterativo({ 
  agendamentos, 
  dentistas, 
  salas = ['01', '02', '03'],
  visualizacao = 'semanal',
  onAgendamentoClick,
  onAgendamentoMove 
}) {
  const [dataAtual, setDataAtual] = useState(new Date());

  const getAgendamentosPorDiaESala = (data, sala) => {
    const dataStr = data.toISOString().split('T')[0];
    return (agendamentos || []).filter(ag => ag.data === dataStr && ag.sala === sala);
  };

  const getAgendamentoNoHorario = (agendamentosDia, horario) => {
    return agendamentosDia.find(ag => ag.horario === horario);
  };

  const handleDragStart = (agendamento, e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(agendamento));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (data, horario, sala, e) => {
    e.preventDefault();
    const agendamentoOriginal = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    const conflito = getAgendamentoNoHorario(
      getAgendamentosPorDiaESala(data, sala),
      horario
    );
    
    if (conflito && conflito.id !== agendamentoOriginal.id) {
      showToast(`Horário ocupado por ${conflito.paciente_nome}`, 'error');
      return;
    }
    
    const agendamentoAtualizado = {
      ...agendamentoOriginal,
      data: data.toISOString().split('T')[0],
      horario: horario,
      sala: sala
    };
    
    onAgendamentoMove?.(agendamentoAtualizado);
    showToast(`Agendamento movido para ${horario} - Sala ${sala}`, 'success');
  };

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const dataAtualStr = dataAtual.toISOString().split('T')[0];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${salas.length}, 1fr)` }}>
          <div className="p-3 border-b bg-gray-50 font-semibold text-sm">Horário</div>
          {salas.map(sala => (
            <div key={sala} className="p-3 border-b border-l bg-gray-50 font-semibold text-sm text-center">
              Sala {sala}
            </div>
          ))}
          
          {HORARIOS.map(horario => (
            <React.Fragment key={horario}>
              <div className="p-2 border-b text-xs text-gray-500 text-right pr-3 bg-gray-50">
                {horario}
              </div>
              {salas.map(sala => {
                const agendamento = getAgendamentoNoHorario(
                  getAgendamentosPorDiaESala(dataAtual, sala),
                  horario
                );
                
                return (
                  <div 
                    key={`${sala}-${horario}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(dataAtual, horario, sala, e)}
                    className="border-b border-l p-1 h-16 cursor-pointer hover:bg-blue-50 transition"
                  >
                    {agendamento && (
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(agendamento, e)}
                        onClick={() => onAgendamentoClick?.(agendamento)}
                        className={`${STATUS_COLORS[agendamento.status] || STATUS_COLORS.agendado} p-2 rounded-lg text-xs cursor-move hover:shadow-md transition-all h-full flex flex-col justify-between`}
                      >
                        <div className="font-medium truncate">{agendamento.paciente_nome}</div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <Stethoscope size={10} />
                          <span className="truncate">{agendamento.procedimento_nome}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px]">{agendamento.status === 'agendado' ? 'Agendado' : agendamento.status}</span>
                          <span className="text-[10px]">{agendamento.dentista_nome?.split(' ')[0]}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
