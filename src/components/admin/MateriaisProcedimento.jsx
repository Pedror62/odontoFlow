import React, { useState } from 'react';
import { Scissors, Package, Plus, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { showToast } from '../Toast';

export default function MateriaisProcedimento({ 
  procedimentos, 
  materiais, 
  materiaisPorProcedimento, 
  onSave 
}) {
  const [procedimentoSelecionado, setProcedimentoSelecionado] = useState(null);
  const [materiaisSelecionados, setMateriaisSelecionados] = useState([]);

  const handleSelecionarProcedimento = (procId) => {
    setProcedimentoSelecionado(procId);
    const existing = materiaisPorProcedimento[procId];
    if (existing) {
      setMateriaisSelecionados(existing.materiais.map(m => ({ ...m })));
    } else {
      setMateriaisSelecionados([]);
    }
  };

  const handleAddMaterial = () => {
    setMateriaisSelecionados([...materiaisSelecionados, { materialId: '', quantidade: 1 }]);
  };

  const handleRemoveMaterial = (index) => {
    const novos = [...materiaisSelecionados];
    novos.splice(index, 1);
    setMateriaisSelecionados(novos);
  };

  const handleUpdateMaterial = (index, field, value) => {
    const novos = [...materiaisSelecionados];
    novos[index][field] = field === 'quantidade' ? parseFloat(value) : parseInt(value);
    setMateriaisSelecionados(novos);
  };

  const handleSave = () => {
    if (!procedimentoSelecionado) return;
    
    // Calcular custo total
    let custoTotal = 0;
    materiaisSelecionados.forEach(item => {
      const material = materiais.find(m => m.id === item.materialId);
      if (material) {
        custoTotal += material.custoUnitario * item.quantidade;
      }
    });
    
    const novosMateriais = {
      ...materiaisPorProcedimento,
      [procedimentoSelecionado]: {
        materiais: materiaisSelecionados,
        custoTotal
      }
    };
    
    onSave(novosMateriais);
    showToast('Materiais do procedimento atualizados!', 'success');
  };

  const procedimento = procedimentos.find(p => p.id == procedimentoSelecionado);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Scissors size={24} /> Materiais por Procedimento
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Associe os materiais necessários para cada procedimento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {/* Lista de Procedimentos */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Procedimentos</h3>
          <div className="space-y-2">
            {procedimentos.map(proc => (
              <button
                key={proc.id}
                onClick={() => handleSelecionarProcedimento(proc.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  procedimentoSelecionado === proc.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                {proc.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Materiais do Procedimento */}
        <div className="md:col-span-2 border rounded-lg p-4">
          {procedimento ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">{procedimento.nome}</h3>
                <button
                  onClick={handleAddMaterial}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} /> Adicionar Material
                </button>
              </div>

              <div className="space-y-3">
                {materiaisSelecionados.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Package size={48} className="mx-auto mb-2" />
                    <p>Nenhum material associado</p>
                    <p className="text-sm">Clique em "Adicionar Material"</p>
                  </div>
                ) : (
                  materiaisSelecionados.map((item, index) => {
                    const material = materiais.find(m => m.id === item.materialId);
                    return (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={item.materialId}
                          onChange={(e) => handleUpdateMaterial(index, 'materialId', e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg"
                        >
                          <option value="">Selecione um material</option>
                          {materiais.map(m => (
                            <option key={m.id} value={m.id}>{m.nome}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.1"
                          value={item.quantidade}
                          onChange={(e) => handleUpdateMaterial(index, 'quantidade', e.target.value)}
                          className="w-24 px-3 py-2 border rounded-lg"
                          placeholder="Qtd"
                        />
                        {material && (
                          <span className="text-sm text-gray-500 w-20">
                            R$ {(material.custoUnitario * item.quantidade).toFixed(2)}
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveMaterial(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {materiaisSelecionados.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Custo Total do Procedimento:</span>
                    <span className="text-xl font-bold text-blue-600">
                      R$ {materiaisSelecionados.reduce((sum, item) => {
                        const material = materiais.find(m => m.id === item.materialId);
                        return sum + (material?.custoUnitario || 0) * item.quantidade;
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handleSave}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Salvar Materiais do Procedimento
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <AlertCircle size={48} className="mx-auto mb-2" />
              <p>Selecione um procedimento à esquerda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}