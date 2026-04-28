import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { showToast } from '../Toast';

export default function UploadImagem({ onUpload, pacienteId, atendimentoId, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione apenas imagens', 'error');
      return;
    }
    
    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Imagem deve ter no máximo 5MB', 'error');
      return;
    }
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Upload (mock - substituir por upload real)
    setUploading(true);
    
    // Simular upload para localStorage
    setTimeout(() => {
      const imageData = {
        id: Date.now(),
        url: preview,
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        paciente_id: pacienteId,
        atendimento_id: atendimentoId,
        data: new Date().toISOString()
      };
      
      onUpload(imageData);
      setUploading(false);
      showToast('Imagem adicionada ao prontuário!', 'success');
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ImageIcon size={20} /> Adicionar Exame
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        {preview ? (
          <div className="mb-4">
            <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
            <button 
              onClick={() => setPreview(null)}
              className="mt-2 text-red-500 text-sm"
            >
              Remover
            </button>
          </div>
        ) : (
          <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition block">
            <Upload className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-gray-500">Clique ou arraste uma imagem</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG até 5MB</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
        
        {uploading && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Enviando...</p>
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => document.querySelector('input[type="file"]').click()}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            disabled={uploading}
          >
            Selecionar Arquivo
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}