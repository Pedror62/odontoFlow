import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Stethoscope, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

export default function AgendaCalendar({ agendamentos, onSelectAgendamento }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const agendamentosDoDia = (date) => {
    return agendamentos.filter(ag => {
      if (!ag.data) return false;
      return isSameDay(parseISO(ag.data), date);
    });
  };

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));

  const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header do Calendário */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar size={24} /> Agenda Semanal
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevWeek}
              className="p-2 hover:bg-gray-100 rounded transition"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-gray-100 rounded transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekDays.map((day, index) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const agendamentosDia = agendamentosDoDia(day);
          
          return (
            <div
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={`bg-white p-3 cursor-pointer hover:bg-gray-50 transition ${
                isSelected ? 'bg-blue-50' : ''
              }`}
            >
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  {diasSemana[index]}
                </div>
                <div className={`text-lg font-semibold mt-1 ${
                  isToday ? 'text-blue-600 bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''
                }`}>
                  {format(day, 'dd')}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {agendamentosDia.length} agendamento{agendamentosDia.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agendamentos do Dia Selecionado */}
      <div className="p-4">
        <h3 className="font-semibold mb-3">
          Agendamentos para {format(selectedDate, "dd/MM/yyyy")}
        </h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {agendamentosDoDia(selectedDate).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={48} className="mx-auto mb-2 text-gray-300" />
              <p>Nenhum agendamento para este dia</p>
              <p className="text-sm mt-1">Clique em "Novo Agendamento" para agendar</p>
            </div>
          ) : (
            agendamentosDoDia(selectedDate).map(ag => (
              <div
                key={ag.id}
                onClick={() => onSelectAgendamento?.(ag)}
                className="border rounded-lg p-3 hover:shadow-md cursor-pointer transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="font-semibold">{ag.horario}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {ag.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-gray-400" />
                      <span className="font-medium">{ag.paciente_nome}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Stethoscope size={14} />
                      <span>{ag.procedimento_nome}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin size={14} />
                      <span>Sala {ag.sala}</span>
                      <span className="mx-2">•</span>
                      <span>Dr(a). {ag.dentista_nome}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <DollarSign size={14} />
                      R$ {ag.valor_final?.toFixed(2)}
                    </div>
                    {ag.desconto > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Desconto: {ag.desconto}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}