import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Stethoscope, DollarSign, CreditCard, Save } from 'lucide-react';
import { showToast } from '../Toast';

export default function AgendamentoForm({ 
  pacientes, 
  procedimentos, 
  dentistas, 
  planos,
  onAgendamento,
  onClose 
}) {
  const [formData, setFormData] = useState({
    paciente_id: '',
    dentista_id: '',
    procedimento_id: '',
    plano_id: '',
    sala: '',
    data: '',
    horario: '',
    status: 'agendado'
  });
  
  const [valorFinal, setValorFinal] = useState(null);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);

  useEffect(() => {
    if (formData.paciente_id) {
      const paciente = pacientes.find(p => p.id == formData.paciente_id);
      setPacienteSelecionado(paciente);
    }
  }, [formData.paciente_id, pacientes]);

  const calcularValor = () => {
    const procedimento = procedimentos.find(p => p.id == formData.procedimento_id);
    const plano = planos.find(p => p.id == formData.plano_id);
    
    if (procedimento && plano) {
      const desconto = (procedimento.valor * plano.cobertura) / 100;
      const valorComDesconto = procedimento.valor - desconto;
      setValorFinal(valorComDesconto);
      return valorComDesconto;
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.paciente_id || !formData.dentista_id || !formData.procedimento_id || !formData.plano_id) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    const valor = calcularValor();
    
    if (!valor) {
      showToast('Selecione procedimento e plano primeiro', 'error');
      return;
    }
    
    const paciente = pacientes.find(p => p.id == formData.paciente_id);
    const procedimento = procedimentos.find(p => p.id == formData.procedimento_id);
    const dentista = dentistas.find(d => d.id == formData.dentista_id);
    const plano = planos.find(p => p.id == formData.plano_id);
    
    const agendamento = {
      id: Date.now(),
      ...formData,
      paciente_nome: paciente?.nome,
      procedimento_nome: procedimento?.nome,
      dentista_nome: dentista?.nome,
      plano_nome: plano?.nome,
      valor_final: valor,
      valor_original: procedimento?.valor,
      desconto: plano?.cobertura,
      created_at: new Date().toISOString()
    };
    
    showToast('Agendamento realizado com sucesso!', 'success');
    onAgendamento(agendamento);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar size={24} /> Novo Agendamento
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seleção de Paciente */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <User size={18} /> Paciente *
            </label>
            <select
              value={formData.paciente_id}
              onChange={(e) => setFormData({...formData, paciente_id: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um paciente</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            {pacienteSelecionado?.convenio && (
              <p className="text-xs text-gray-500 mt-1">
                Convênio: {pacienteSelecionado.convenio}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dentista */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Stethoscope size={18} /> Dentista *
              </label>
              <select
                value={formData.dentista_id}
                onChange={(e) => setFormData({...formData, dentista_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione</option>
                {dentistas.map(d => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </div>

            {/* Procedimento */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Stethoscope size={18} /> Procedimento *
              </label>
              <select
                value={formData.procedimento_id}
                onChange={(e) => {
                  setFormData({...formData, procedimento_id: e.target.value});
                  setValorFinal(null);
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione</option>
                {procedimentos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - R$ {p.valor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plano */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <CreditCard size={18} /> Plano de Saúde *
              </label>
              <select
                value={formData.plano_id}
                onChange={(e) => {
                  setFormData({...formData, plano_id: e.target.value});
                  setValorFinal(null);
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione</option>
                {planos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.cobertura}% cobertura)
                  </option>
                ))}
              </select>
            </div>

            {/* Sala */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin size={18} /> Sala *
              </label>
              <input
                type="text"
                value={formData.sala}
                onChange={(e) => setFormData({...formData, sala: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Sala 01"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar size={18} /> Data *
              </label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({...formData, data: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Horário */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Clock size={18} /> Horário *
              </label>
              <input
                type="time"
                value={formData.horario}
                onChange={(e) => setFormData({...formData, horario: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Valor */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold flex items-center gap-2">
                <DollarSign size={18} /> Valor a pagar:
              </span>
              {valorFinal ? (
                <span className="text-2xl font-bold text-blue-600">
                  R$ {valorFinal.toFixed(2)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={calcularValor}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  disabled={!formData.procedimento_id || !formData.plano_id}
                >
                  Calcular valor
                </button>
              )}
            </div>
            {valorFinal && formData.plano_id != 3 && (
              <p className="text-sm text-green-600 mt-2">
                *Desconto do plano aplicado automaticamente
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={18} /> Confirmar Agendamento
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}