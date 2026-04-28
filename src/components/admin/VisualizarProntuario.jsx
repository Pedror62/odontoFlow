import React, { useState, useEffect } from 'react';
import { History, Clock, FileText, X, Camera, Image as ImageIcon } from 'lucide-react';
import { showToast } from '../Toast';

export default function VisualizarProntuario({ paciente, onClose }) {
  const [historico, setHistorico] = useState([]);
  const [imagens, setImagens] = useState([]);

  useEffect(() => {
    // Carregar histórico do paciente
    const savedHistorico = localStorage.getItem(`prontuario_${paciente.id || paciente.nome}`);
    if (savedHistorico) {
      setHistorico(JSON.parse(savedHistorico));
    }
    
    // Carregar imagens do paciente
    const savedImagens = localStorage.getItem('imagens');
    if (savedImagens) {
      const todasImagens = JSON.parse(savedImagens);
      const imagensPaciente = todasImagens.filter(img => 
        img.paciente_id === paciente.id || img.paciente_nome === paciente.nome
      );
      setImagens(imagensPaciente);
    }
  }, [paciente]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Prontuário do Paciente</h2>
            <p className="text-sm text-gray-500">{paciente.nome}</p>
            <p className="text-xs text-gray-400">Visualização apenas - Modo leitura</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Imagens/Exames */}
          {imagens.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <Camera size={18} /> Exames e Raio-X
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {imagens.map(img => (
                  <div key={img.id} className="relative">
                    <img
                      src={img.url}
                      alt={img.nome}
                      className="w-full h-24 object-cover rounded-lg cursor-pointer"
                      onClick={() => window.open(img.url, '_blank')}
                    />
                    <p className="text-xs text-gray-500 mt-1 truncate">{new Date(img.data).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico */}
          <div>
            <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <History size={18} /> Histórico Clínico
            </h3>
            <div className="space-y-3">
              {historico.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText size={48} className="mx-auto mb-2" />
                  <p>Nenhum registro no prontuário</p>
                </div>
              ) : (
                historico.map(registro => (
                  <div key={registro.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Clock size={12} />
                      <span>{registro.data}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        registro.tipo === 'sistema' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {registro.tipo === 'sistema' ? '🤖 Automático' : '📝 Manual'}
                      </span>
                    </div>
                    <p className="text-gray-800">{registro.descricao}</p>
                    {registro.anotacoes && (
                      <p className="text-sm text-gray-600 mt-1 bg-white p-2 rounded">
                        {registro.anotacoes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-500">
          Histórico clínico confidencial - Acesso restrito
        </div>
      </div>
    </div>
  );
}