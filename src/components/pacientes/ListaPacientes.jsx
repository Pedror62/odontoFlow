import React, { useState } from 'react';
import { Search, Edit, Trash2, UserPlus, Phone, Mail } from 'lucide-react';
import { showToast } from '../Toast';

export default function ListaPacientes({ pacientes, onEdit, onDelete, onSelect }) {
  const [search, setSearch] = useState('');

  const pacientesFiltrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.telefone?.includes(search)
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Pacientes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-64"
            />
          </div>
        </div>
      </div>

      <div className="divide-y max-h-96 overflow-y-auto">
        {pacientesFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum paciente cadastrado
          </div>
        ) : (
          pacientesFiltrados.map(paciente => (
            <div key={paciente.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => onSelect(paciente)}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{paciente.nome}</h3>
                  {paciente.telefone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Phone size={14} /> {paciente.telefone}
                    </div>
                  )}
                  {paciente.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Mail size={14} /> {paciente.email}
                    </div>
                  )}
                  {paciente.convenio && (
                    <div className="text-xs text-blue-600 mt-2">
                      Convênio: {paciente.convenio}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(paciente); }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(paciente.id); }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}