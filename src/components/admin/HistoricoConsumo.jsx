import React, { useState } from 'react';
import { History, Search, Calendar, DollarSign, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function HistoricoConsumo({ historicoConsumo, materiais }) {
  const [search, setSearch] = useState('');
  const [dataFiltro, setDataFiltro] = useState('');

  const historicoFiltrado = historicoConsumo.filter(item => {
    if (search && !item.pacienteNome.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (dataFiltro && !item.data.includes(dataFiltro)) {
      return false;
    }
    return true;
  });

  const totalGasto = historicoConsumo.reduce((sum, item) => sum + item.custoTotal, 0);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History size={24} /> Histórico de Consumo
          </h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por paciente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64"
              />
            </div>
            <input
              type="date"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Total de Consumos</p>
          <p className="text-2xl font-bold text-blue-600">{historicoConsumo.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Total Gasto em Materiais</p>
          <p className="text-2xl font-bold text-green-600">R$ {totalGasto.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Média por Atendimento</p>
          <p className="text-2xl font-bold text-purple-600">
            R$ {(totalGasto / (historicoConsumo.length || 1)).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Lista de Consumos */}
      <div className="divide-y max-h-96 overflow-y-auto">
        {historicoFiltrado.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package size={48} className="mx-auto mb-2" />
            <p>Nenhum consumo registrado</p>
          </div>
        ) : (
          historicoFiltrado.map(item => (
            <div key={item.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm text-gray-500">
                      {new Date(item.data).toLocaleString()}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {item.procedimentoNome}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      Sala {item.sala}
                    </span>
                  </div>
                  <p className="font-medium">{item.pacienteNome}</p>
                  <p className="text-sm text-gray-600">Dentista: {item.dentistaNome}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">R$ {item.custoTotal.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-2 text-sm">
                <p className="text-gray-600 mb-1">Materiais utilizados:</p>
                <div className="flex flex-wrap gap-2">
                  {item.materiais.map((mat, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {mat.materialNome}: {mat.quantidade} un - R$ {mat.custo.toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}