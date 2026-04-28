import React from 'react';
import { PauseCircle, PlayCircle, Clock, User, Stethoscope } from 'lucide-react';

export default function PauseCard({ pausados, onRetomar }) {
  if (pausados.length === 0) return null;

  const calcularTempoPausa = (pausadoEm) => {
    const inicio = new Date(pausadoEm);
    const agora = new Date();
    const diffMinutos = Math.floor((agora - inicio) / (1000 * 60));
    
    if (diffMinutos < 60) return `${diffMinutos} min`;
    const horas = Math.floor(diffMinutos / 60);
    const minutos = diffMinutos % 60;
    return `${horas}h ${minutos}min`;
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
            <PauseCircle size={18} />
            Atendimentos Pausados ({pausados.length})
          </h3>
          <span className="text-xs text-yellow-600">Aguardando retorno do paciente</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pausados.map(pausado => (
            <div key={pausado.id} className="bg-white rounded-lg shadow-md border-l-4 border-yellow-500 overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    <span className="font-semibold text-gray-800">{pausado.paciente}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <Clock size={12} />
                    <span>{calcularTempoPausa(pausado.pausado_em)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Stethoscope size={14} />
                  <span>{pausado.procedimento}</span>
                </div>
                
                <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 mb-3">
                  ⏸️ Pausado às {new Date(pausado.pausado_em).toLocaleTimeString()}
                  <br />
                  Motivo: {pausado.motivo}
                </div>
                
                <button
                  onClick={() => onRetomar(pausado)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                >
                  <PlayCircle size={16} /> Retomar Atendimento
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}