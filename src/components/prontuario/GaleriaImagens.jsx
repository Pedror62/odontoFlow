import React, { useState } from 'react';
import { ZoomIn, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GaleriaImagens({ imagens, onDelete, onDownload }) {
  const [imagemSelecionada, setImagemSelecionada] = useState(null);

  if (imagens.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <ImageIcon size={48} className="mx-auto mb-2" />
        <p>Nenhum exame adicionado</p>
        <p className="text-sm">Clique em "Adicionar Exame" para anexar raio-x ou fotos</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {imagens.map(img => (
          <div key={img.id} className="relative group">
            <img
              src={img.url}
              alt={img.nome}
              className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
              onClick={() => setImagemSelecionada(img)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button 
                onClick={() => onDownload(img)}
                className="p-1 bg-white rounded-full hover:bg-gray-100"
              >
                <Download size={16} />
              </button>
              <button 
                onClick={() => onDelete(img.id)}
                className="p-1 bg-white rounded-full hover:bg-red-100 text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">{img.nome}</p>
            <p className="text-xs text-gray-400">{new Date(img.data).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
      
      {/* Modal de visualização */}
      {imagemSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <button 
            onClick={() => setImagemSelecionada(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={32} />
          </button>
          <img 
            src={imagemSelecionada.url} 
            alt={imagemSelecionada.nome}
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-4 left-0 right-0 text-center text-white">
            <p className="text-sm">{imagemSelecionada.nome}</p>
            <p className="text-xs opacity-75">{new Date(imagemSelecionada.data).toLocaleString()}</p>
          </div>
        </div>
      )}
    </>
  );
}