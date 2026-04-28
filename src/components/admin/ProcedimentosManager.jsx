import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, DollarSign, Activity } from 'lucide-react';
import { showToast } from '../Toast';

export default function ProcedimentosManager({ procedimentos, onSave, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    duracao: 30,
    descricao: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.valor) {
      showToast('Preencha nome e valor do procedimento', 'error');
      return;
    }

    const novoProcedimento = {
      id: editando?.id || Date.now(),
      ...formData,
      valor: parseFloat(formData.valor)
    };

    onSave(novoProcedimento);
    setShowForm(false);
    setEditando(null);
    setFormData({ nome: '', valor: '', duracao: 30, descricao: '' });
    showToast(editando ? 'Procedimento atualizado!' : 'Procedimento adicionado!', 'success');
  };

  const handleEdit = (procedimento) => {
    setEditando(procedimento);
    setFormData({
      nome: procedimento.nome,
      valor: procedimento.valor,
      duracao: procedimento.duracao || 30,
      descricao: procedimento.descricao || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este procedimento?')) {
      onDelete(id);
      showToast('Procedimento excluído!', 'success');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity size={24} /> Procedimentos
        </h2>
        <button
          onClick={() => {
            setEditando(null);
            setFormData({ nome: '', valor: '', duracao: 30, descricao: '' });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Novo Procedimento
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Procedimento</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Valor</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Duração</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Descrição</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {procedimentos.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  Nenhum procedimento cadastrado
                </td>
              </tr>
            ) : (
              procedimentos.map(proc => (
                <tr key={proc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{proc.nome}</td>
                  <td className="px-4 py-3 text-green-600 font-semibold">
                    R$ {proc.valor.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{proc.duracao || 30} min</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{proc.descricao || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(proc)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(proc.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editando ? 'Editar Procedimento' : 'Novo Procedimento'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Procedimento *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Duração (minutos)</label>
                <select
                  value={formData.duracao}
                  onChange={(e) => setFormData({...formData, duracao: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1 hora e 30 minutos</option>
                  <option value="120">2 horas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Descrição detalhada do procedimento..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Salvar
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