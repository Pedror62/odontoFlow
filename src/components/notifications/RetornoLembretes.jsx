import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Bell, Stethoscope, X } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useData } from '../../contexts/DataContext';

export default function RetornoLembretes() {
  const { lembretesRetorno, verificarRetornosPendentes } = useNotification();
  const { agendamentos } = useData();
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    if (agendamentos) {
      verificarRetornosPendentes(agendamentos);
    }
  }, [agendamentos]);

  // Auto-esconder após 5 segundos
  useEffect(() => {
    if (lembretesRetorno.length > 0) {
      const timer = setTimeout(() => {
        setVisivel(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lembretesRetorno]);

  if (lembretesRetorno.length === 0 || !visivel) {
    return null;
  }

  const retornosHoje = lembretesRetorno.filter(r => r.urgente);

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-lg animate-in slide-in-from-left-5 duration-300">
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <Calendar className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 text-sm">Lembretes de Hoje</h4>
              {retornosHoje.map((retorno, index) => (
                <div key={index} className="mt-2 text-sm">
                  <p className="font-medium text-blue-800">{retorno.paciente_nome}</p>
                  <p className="text-xs text-blue-600">
                    {retorno.procedimento_nome} às {retorno.horario} - Sala {retorno.sala}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setVisivel(false)}
            className="text-blue-500 hover:text-blue-700"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}