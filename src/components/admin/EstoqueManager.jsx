import React, { useState } from 'react';
import { 
  Package, AlertTriangle, TrendingUp, Search, Plus, 
  Edit, Trash2, Save, X, Truck, Scissors
} from 'lucide-react';
import { showToast } from '../Toast';

export default function EstoqueManager({ materiais, onSave, onDelete, onAdicionarEstoque }) {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Descartável',
    unidade: 'un',
    estoque: 0,
    estoqueMinimo: 10,
    custoUnitario: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || formData.estoque < 0) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    const novoMaterial = {
      id: editando?.id || Date.now(),
      ...formData,
      custoUnitario: parseFloat(formData.custoUnitario),
      estoque: parseInt(formData.estoque),
      estoqueMinimo: parseInt(formData.estoqueMinimo)
    };

    onSave(novoMaterial);
    setShowForm(false);
    setEditando(null);
    setFormData({ nome: '', tipo: 'Descartável', unidade: 'un', estoque: 0, estoqueMinimo: 10, custoUnitario: 0 });
    showToast(editando ? 'Material atualizado!' : 'Material adicionado!', 'success');
  };

  const handleEdit = (material) => {
    setEditando(material);
    setFormData({
      nome: material.nome,
      tipo: material.tipo,
      unidade: material.unidade,
      estoque: material.estoque,
      estoqueMinimo: material.estoqueMinimo,
      custoUnitario: material.custoUnitario
    });
    setShowForm(true);
  };

  const handleAdicionarEstoque = (material) => {
    const quantidade = prompt(`Quantos ${material.unidade}s deseja adicionar ao estoque?`, '10');
    if (quantidade && !isNaN(quantidade)) {
      onAdicionarEstoque(material.id, parseInt(quantidade));
      showToast(`${quantidade} ${material.unidade}(s) adicionados ao estoque!`, 'success');
    }
  };

  const materiaisFiltrados = materiais.filter(m => 
    m.nome.toLowerCase().includes(search.toLowerCase())
  );

  const materiaisComEstoqueBaixo = materiais.filter(m => m.estoque <= m.estoqueMinimo);
  const valorTotalEstoque = materiais.reduce((sum, m) => sum + (m.estoque * m.custoUnitario), 0);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total de Materiais</p>
              <p className="text-2xl font-bold">{materiais.length}</p>
            </div>
            <Package className="text-blue-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Valor Total em Estoque</p>
              <p className="text-2xl font-bold">R$ {valorTotalEstoque.toFixed(2)}</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Materiais com Estoque Baixo</p>
              <p className="text-2xl font-bold text-yellow-600">{materiaisComEstoqueBaixo.length}</p>
            </div>
            <AlertTriangle className="text-yellow-500" size={32} />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package size={24} /> Gestão de Estoque
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar material..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setEditando(null);
              setFormData({ nome: '', tipo: 'Descartável', unidade: 'un', estoque: 0, estoqueMinimo: 10, custoUnitario: 0 });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} /> Novo Material
          </button>
        </div>

        {/* Tabela de Materiais */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Material</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Unidade</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Estoque</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Mínimo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Custo Unit.</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {materiaisFiltrados.map(material => {
                const isEstoqueBaixo = material.estoque <= material.estoqueMinimo;
                return (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{material.nome}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">{material.tipo}</span>
                    </td>
                    <td className="px-4 py-3">{material.unidade}</td>
                    <td className="px-4 py-3">
                      <span className={isEstoqueBaixo ? 'text-red-600 font-bold' : ''}>
                        {material.estoque}
                      </span>
                    </td>
                    <td className="px-4 py-3">{material.estoqueMinimo}</td>
                    <td className="px-4 py-3">R$ {material.custoUnitario.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {isEstoqueBaixo ? (
                        <span className="flex items-center gap-1 text-yellow-600 text-sm">
                          <AlertTriangle size={14} /> Baixo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <Package size={14} /> Normal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAdicionarEstoque(material)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Adicionar ao estoque"
                        >
                          <Plus size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Tem certeza?')) onDelete(material.id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editando ? 'Editar Material' : 'Novo Material'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Material *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>Descartável</option>
                    <option>Medicamento</option>
                    <option>Material</option>
                    <option>Limpeza</option>
                    <option>Equipamento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unidade</label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => setFormData({...formData, unidade: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>un</option>
                    <option>par</option>
                    <option>pacote</option>
                    <option>rolo</option>
                    <option>ampola</option>
                    <option>seringa</option>
                    <option>litro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    value={formData.estoque}
                    onChange={(e) => setFormData({...formData, estoque: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={formData.estoqueMinimo}
                    onChange={(e) => setFormData({...formData, estoqueMinimo: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Custo Unitário (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.custoUnitario}
                  onChange={(e) => setFormData({...formData, custoUnitario: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
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