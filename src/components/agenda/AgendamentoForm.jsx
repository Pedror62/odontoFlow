import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, User, Stethoscope, DollarSign, 
  CreditCard, Save, X, Zap, ChevronRight, AlertCircle, 
  CheckCircle, Loader, Calendar as CalendarIcon
} from 'lucide-react';
import { showToast } from '../Toast';

// Função auxiliar: converter horário para minutos
const horarioParaMinutos = (horario) => {
  const [hora, minuto] = horario.split(':').map(Number);
  return hora * 60 + minuto;
};

// Função auxiliar: converter minutos para horário
const minutosParaHorario = (minutos) => {
  const hora = Math.floor(minutos / 60);
  const minuto = minutos % 60;
  return `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
};

// Duração padrão por procedimento (minutos)
const DURACAO_POR_PROCEDIMENTO = {
  1: 30, // Limpeza
  2: 90, // Canal
  3: 45, // Extração
  4: 30, // Restauração
  5: 60, // Clareamento
  default: 30
};

export default function AgendamentoForm({ 
  pacientes, 
  procedimentos, 
  dentistas, 
  planos,
  agendamentos = [],
  onAgendamento,
  onClose,
  onAtualizarAgenda
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
  const [carregando, setCarregando] = useState(false);
  const [sugestoesHorarios, setSugestoesHorarios] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [duracaoProcedimento, setDuracaoProcedimento] = useState(30);

  // Atualizar paciente selecionado
  useEffect(() => {
    if (formData.paciente_id) {
      const paciente = pacientes.find(p => p.id == formData.paciente_id);
      setPacienteSelecionado(paciente);
    }
  }, [formData.paciente_id, pacientes]);

  // Atualizar duração do procedimento
  useEffect(() => {
    if (formData.procedimento_id) {
      const proc = procedimentos.find(p => p.id == formData.procedimento_id);
      const duracao = proc?.duracao || DURACAO_POR_PROCEDIMENTO[formData.procedimento_id] || 30;
      setDuracaoProcedimento(duracao);
    }
  }, [formData.procedimento_id, procedimentos]);

  // Verificar horários ocupados quando data, dentista ou procedimento mudam
  useEffect(() => {
    if (formData.data && formData.dentista_id && formData.procedimento_id) {
      verificarHorariosOcupados();
    }
  }, [formData.data, formData.dentista_id, formData.procedimento_id]);

  // Calcular valor final
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

  // Verificar horários ocupados do dentista
  const verificarHorariosOcupados = () => {
    const ocupados = [];
    const agendamentosDentista = agendamentos.filter(ag => 
      ag.dentista_id == formData.dentista_id && 
      ag.data === formData.data &&
      ag.status !== 'cancelado'
    );
    
    for (const ag of agendamentosDentista) {
      const proc = procedimentos.find(p => p.id == ag.procedimento_id);
      const duracao = proc?.duracao || DURACAO_POR_PROCEDIMENTO[ag.procedimento_id] || 30;
      const inicio = horarioParaMinutos(ag.horario);
      const fim = inicio + duracao;
      ocupados.push({ inicio, fim, paciente: ag.paciente_nome });
    }
    
    setHorariosOcupados(ocupados);
  };

  // Verificar se um horário está disponível
  const isHorarioDisponivel = (horario) => {
    const inicio = horarioParaMinutos(horario);
    const fim = inicio + duracaoProcedimento;
    
    for (const ocupado of horariosOcupados) {
      if (inicio < ocupado.fim && fim > ocupado.inicio) {
        return false;
      }
    }
    return true;
  };

  // Encontrar próximos horários disponíveis
  const encontrarProximosHorarios = () => {
    if (!formData.dentista_id || !formData.procedimento_id) {
      showToast('Selecione dentista e procedimento primeiro', 'error');
      return;
    }
    
    if (!formData.data) {
      showToast('Selecione uma data primeiro', 'error');
      return;
    }
    
    setCarregando(true);
    
    // Simular processamento
    setTimeout(() => {
      const horariosDisponiveis = [];
      const inicioExpediente = 8 * 60; // 08:00
      const fimExpediente = 19 * 60; // 19:00 (último horário para não passar das 20:00)
      
      // Verificar horários de 30 em 30 minutos
      for (let minutos = inicioExpediente; minutos + duracaoProcedimento <= fimExpediente; minutos += 30) {
        const horario = minutosParaHorario(minutos);
        const inicio = minutos;
        const fim = inicio + duracaoProcedimento;
        
        let conflito = false;
        for (const ocupado of horariosOcupados) {
          if (inicio < ocupado.fim && fim > ocupado.inicio) {
            conflito = true;
            break;
          }
        }
        
        if (!conflito) {
          horariosDisponiveis.push({
            horario,
            inicio,
            fim,
            duracao: duracaoProcedimento
          });
        }
      }
      
      setSugestoesHorarios(horariosDisponiveis);
      setMostrarSugestoes(true);
      setCarregando(false);
      
      if (horariosDisponiveis.length === 0) {
        showToast('Não há horários disponíveis nesta data. Tente outra data.', 'warning');
      } else {
        showToast(`Encontrados ${horariosDisponiveis.length} horários disponíveis!`, 'success');
      }
    }, 500);
  };

  // Aplicar horário sugerido
  const aplicarHorarioSugerido = (sugestao) => {
    setFormData({ ...formData, horario: sugestao.horario });
    setMostrarSugestoes(false);
    showToast(`Horário ${sugestao.horario} selecionado!`, 'success');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.paciente_id || !formData.dentista_id || !formData.procedimento_id || !formData.plano_id) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    if (!formData.horario) {
      showToast('Selecione um horário (use o botão "Encontrar horários")', 'error');
      return;
    }
    
    // Verificar conflito novamente antes de salvar
    if (!isHorarioDisponivel(formData.horario)) {
      showToast('Este horário não está mais disponível. Por favor, busque novos horários.', 'error');
      return;
    }
    
    const valor = calcularValor();
    
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
      duracao: duracaoProcedimento,
      created_at: new Date().toISOString()
    };
    
    onAgendamento(agendamento);
    showToast('Agendamento realizado com sucesso!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-white sticky top-0 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar size={24} /> Novo Agendamento
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Preencha os dados da consulta</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Seleção de Paciente */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <User size={18} /> Paciente *
            </label>
            <div className="relative">
              <select
                value={formData.paciente_id}
                onChange={(e) => setFormData({...formData, paciente_id: e.target.value})}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                required
              >
                <option value="">Selecione um paciente</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={18} />
            </div>
            {pacienteSelecionado && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm">
                <span className="font-medium">📞 {pacienteSelecionado.telefone || 'Sem telefone'}</span>
                <span className="mx-2">•</span>
                <span>🏥 {pacienteSelecionado.convenio || 'Particular'}</span>
              </div>
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
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione</option>
                {procedimentos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - R$ {p.valor} ({p.duracao || DURACAO_POR_PROCEDIMENTO[p.id] || 30} min)
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
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <select
                value={formData.sala}
                onChange={(e) => setFormData({...formData, sala: e.target.value})}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione</option>
                <option value="01">Sala 01</option>
                <option value="02">Sala 02</option>
                <option value="03">Sala 03</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <CalendarIcon size={18} /> Data *
              </label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({...formData, data: e.target.value})}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Horário com botão de busca inteligente */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Clock size={18} /> Horário *
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.horario}
                  onChange={(e) => setFormData({...formData, horario: e.target.value})}
                  className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={formData.horario === 'auto'}
                >
                  <option value="">Selecione ou busque</option>
                  <option value="auto">🔍 Buscar horários disponíveis</option>
                </select>
                <button
                  type="button"
                  onClick={encontrarProximosHorarios}
                  disabled={carregando || !formData.dentista_id || !formData.procedimento_id || !formData.data}
                  className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {carregando ? <Loader size={18} className="animate-spin" /> : <Zap size={18} />}
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </div>
              {formData.procedimento_id && (
                <p className="text-xs text-gray-500 mt-1">
                  ⏱️ Duração do procedimento: {duracaoProcedimento} minutos
                </p>
              )}
            </div>
          </div>

          {/* Sugestões de Horários */}
          {mostrarSugestoes && sugestoesHorarios.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-green-600" />
                <span className="font-medium text-green-800">Horários disponíveis encontrados:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {sugestoesHorarios.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => aplicarHorarioSugerido(sug)}
                    className="px-3 py-2 bg-white border border-green-300 rounded-lg text-sm font-medium hover:bg-green-100 transition flex items-center justify-between group"
                  >
                    <span>{sug.horario}</span>
                    <ChevronRight size={14} className="text-green-500 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-green-600 mt-3">
                💡 Clique em um horário para selecioná-lo
              </p>
            </div>
          )}

          {mostrarSugestoes && sugestoesHorarios.length === 0 && !carregando && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Não há horários disponíveis nesta data para o dentista selecionado.
                </span>
              </div>
              <p className="text-xs text-yellow-600 mt-2">
                💡 Tente selecionar outra data ou outro dentista
              </p>
            </div>
          )}

          {/* Valor */}
          <div className="bg-gray-50 p-4 rounded-xl">
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
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <CreditCard size={14} />
                *Desconto do plano aplicado automaticamente
              </p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Save size={18} /> Confirmar Agendamento
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
