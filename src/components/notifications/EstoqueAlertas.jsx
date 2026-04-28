import React, { useEffect, useState } from 'react';
import { AlertTriangle, Package, MapPin, X } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useMaterial } from '../../contexts/MaterialContext';

export default function EstoqueAlertas() {
  const { alertasEstoque, verificarEstoqueBaixo, limparAlertas } = useNotification();
  const { materiais, distribuicaoSala } = useMaterial();
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    if (materiais && distribuicaoSala && alertasEstoque.length === 0) {
      verificarEstoqueBaixo(materiais, distribuicaoSala);
    }
  }, [materiais, distribuicaoSala]);

  // Auto-esconder após 5 segundos
  useEffect(() => {
    if (alertasEstoque.length > 0) {
      const timer = setTimeout(() => {
        setVisivel(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertasEstoque]);

  if (alertasEstoque.length === 0 || !visivel) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow-lg animate-in slide-in-from-right-5 duration-300">
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 text-sm">Alertas de Estoque</h4>
              <div className="mt-1 space-y-1">
                {alertasEstoque.slice(0, 3).map((alerta, index) => (
                  <div key={index} className="text-xs text-yellow-700 flex items-center gap-1">
                    {alerta.tipo === 'geral' ? (
                      <Package size={12} />
                    ) : (
                      <MapPin size={12} />
                    )}
                    <span>
                      {alerta.tipo === 'geral' 
                        ? `${alerta.material}: ${alerta.estoque} unid.`
                        : `Sala ${alerta.sala}: ${alerta.material} - ${alerta.quantidade} unid.`}
                    </span>
                  </div>
                ))}
                {alertasEstoque.length > 3 && (
                  <p className="text-xs text-yellow-600">+ {alertasEstoque.length - 3} outros alertas</p>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setVisivel(false)}
            className="text-yellow-500 hover:text-yellow-700"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}