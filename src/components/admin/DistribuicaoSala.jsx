import React, { useState } from 'react';
import { MapPin, Package, Truck, AlertTriangle, Plus } from 'lucide-react';
import { showToast } from '../Toast';

export default function DistribuicaoSala({ 
  salas, 
  materiais, 
  distribuicaoSala, 
  onReporMaterial 
}) {
  const [salaSelecionada, setSalaSelecionada] = useState('01');

  const materiaisNaSala = distribuicaoSala[salaSelecionada] || [];

  const getMaterialNome = (id) => {
    const material = materiais.find(m => m.id === id);
    return material?.nome || 'Desconhecido';
  };

  const getMaterialEstoqueGeral = (id) => {
    const material = materiais.find(m => m.id === id);
    return material?.estoque || 0;
  };

  const handleRepor = (materialId) => {
    const quantidade = prompt('Quantidade a repor:', '10');
    if (quantidade && !isNaN(quantidade)) {
      const result = onReporMaterial(salaSelecionada, materialId, parseInt(quantidade));
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    }
  };

  // Alertas por sala
  const alertas = materiaisNaSala.filter(item => item.quantidade < 10);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MapPin size={24} /> Distribuição de Materiais por Sala
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie o estoque de cada sala separadamente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
        {/* Lista de Salas */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Salas</h3>
          <div className="space-y-2">
            {salas.map(sala => (
              <button
                key={sala}
                onClick={() => setSalaSelecionada(sala)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  salaSelecionada === sala
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                Sala {sala}
              </button>
            ))}
          </div>
        </div>

        {/* Materiais da Sala */}
        <div className="md:col-span-3 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Sala {salaSelecionada}</h3>
            {alertas.length > 0 && (
              <div className="flex items-center gap-2 text-yellow-600 text-sm">
                <AlertTriangle size={16} />
                {alertas.length} material(s) com estoque baixo
              </div>
            )}
          </div>

          {materiaisNaSala.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package size={48} className="mx-auto mb-2" />
              <p>Nenhum material distribuído para esta sala</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Material</th>
                    <th className="px-4 py-2 text-left">Quantidade</th>
                    <th className="px-4 py-2 text-left">Estoque Geral</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {materiaisNaSala.map(item => {
                    const estoqueGeral = getMaterialEstoqueGeral(item.materialId);
                    const isBaixo = item.quantidade < 10;
                    return (
                      <tr key={item.materialId}>
                        <td className="px-4 py-2">{getMaterialNome(item.materialId)}</td>
                        <td className="px-4 py-2 font-medium">{item.quantidade}</td>
                        <td className="px-4 py-2">{estoqueGeral}</td>
                        <td className="px-4 py-2">
                          {isBaixo ? (
                            <span className="text-yellow-600 text-sm flex items-center gap-1">
                              <AlertTriangle size={14} /> Baixo
                            </span>
                          ) : (
                            <span className="text-green-600 text-sm">Normal</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleRepor(item.materialId)}
                            className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            disabled={estoqueGeral === 0}
                          >
                            <Truck size={14} /> Repor
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}