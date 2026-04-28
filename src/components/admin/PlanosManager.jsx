import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, CreditCard, Percent } from 'lucide-react';
import { showToast } from '../Toast';

export default function PlanosManager({ planos, onSave, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cobertura: '',
    tipo: 'percentual',
    empresa: '',
    contato: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.cobertura) {
      showToast('Preencha nome e cobertura do plano', 'error');
      return;
    }

    const novoPlano = {
      id: editando?.id || Date.now(),
      ...formData,
      cobertura: parseFloat(formData.cobertura)
    };

    onSave(novoPlano);
    setShowForm(false);
    setEditando(null);
    setFormData({ nome: '', cobertura: '', tipo: 'percentual', empresa: '', contato: '' });
    showToast(editando ? 'Plano atualizado!' : 'Plano adicionado!', 'success');
  };

  const handleEdit = (plano) => {
    setEditando(plano);
    setFormData({
      nome: plano.nome,
      cobertura: plano.cobertura,
      tipo: plano.tipo || 'percentual',
      empresa: plano.empresa || '',
      contato: plano.contato || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      onDelete(id);
      showToast('Plano excluído!', 'success');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CreditCard size={24} /> Planos de Saúde
        </h2>
        <button
          onClick={() => {
            setEditando(null);
            setFormData({ nome: '', cobertura: '', tipo: 'percentual', empresa: '', contato: '' });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus size={18} /> Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {planos.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Nenhum plano cadastrado
          </div>
        ) : (
          planos.map(plano => (
            <div key={plano.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-gray-800">{plano.nome}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(plano)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(plano.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cobertura:</span>
                  <span className="font-semibold text-green-600">
                    {plano.cobertura}%
                  </span>
                </div>
                
                {plano.empresa && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Empresa:</span> {plano.empresa}
                  </div>
                )}
                
                {plano.contato && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Contato:</span> {plano.contato}
                  </div>
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                Desconto aplicado automaticamente nos agendamentos
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editando ? 'Editar Plano' : 'Novo Plano de Saúde'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Plano *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Uniodonto, Amil Dental, Particular"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Percent size={16} /> Cobertura (%) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={formData.cobertura}
                  onChange={(e) => setFormData({...formData, cobertura: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 80 (80% de cobertura)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Percentual de cobertura do plano sobre o valor do procedimento
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Empresa/Operadora</label>
                <input
                  type="text"
                  value={formData.empresa}
                  onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nome da operadora"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Telefone de Contato</label>
                <input
                  type="text"
                  value={formData.contato}
                  onChange={(e) => setFormData({...formData, contato: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg mt-2">
                <p className="text-sm text-blue-800">
                  💡 Exemplo: Um procedimento de R$ 1000 com cobertura de 80% resulta em R$ 200 para o paciente.
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Salvar Plano
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}