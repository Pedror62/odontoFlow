import React, { useState } from 'react';
import { CheckCircle2, Clock, MessageSquare, CalendarClock } from 'lucide-react';

export default function DentistView({ agenda, onFinalizarAtendimento }) {
  const [relato, setRelato] = useState('');
  const [dataRetorno, setDataRetorno] = useState('');
  const [solicitarRetorno, setSolicitarRetorno] = useState(false);

  // Filtra apenas pacientes que estão na clínica (em espera ou em atendimento)
  const pacientesParaAtender = (agenda || []).filter(
    (ag) => ag.status !== 'Finalizado' && ag.status !== 'cancelado'
  );

  const handleFinalizar = (agendamento) => {
    const dadosFinalizacao = {
      ...agendamento,
      status: solicitarRetorno ? 'retorno_pendente' : 'Finalizado',
      relato_clinico: relato,
      solicitar_retorno: solicitarRetorno,
      data_retorno_sugerida: dataRetorno,
      observacao_dentista: relato, // O relato vira a observação para a secretaria
      data_finalizado: new Date().toISOString()
    };

    onFinalizarAtendimento(dadosFinalizacao);
    
    // Limpa os estados para o próximo atendimento
    setRelato('');
    setDataRetorno('');
    setSolicitarRetorno(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="mb-8">
        <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">
          Atendimentos do Dia
        </h2>
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
          Consultório 01 • Dr(a). {/* Nome do Dentista logado */}
        </p>
      </header>

      {pacientesParaAtender.length > 0 ? (
        pacientesParaAtender.map((ag) => (
          <div key={ag.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            {/* Header do Card */}
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black italic text-xl">
                  {ag.paciente_nome?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black italic text-slate-800">{ag.paciente_nome}</h3>
                  <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
                    {ag.procedimento_nome || ag.procedimento}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 flex items-center gap-1 justify-end">
                  <Clock size={12} /> Chegada: {ag.hora}
                </p>
              </div>
            </div>

            {/* Corpo do Atendimento */}
            <div className="p-8 space-y-6">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 mb-3 ml-2">
                  <MessageSquare size={14} /> Evolução Clínica / Relato
                </label>
                <textarea
                  className="w-full p-6 bg-slate-50 rounded-[30px] border-none font-medium text-slate-700 focus:ring-2 ring-indigo-100 transition-all outline-none min-h-[120px]"
                  placeholder="Descreva os procedimentos realizados e observações clínicas..."
                  value={relato}
                  onChange={(e) => setRelato(e.target.value)}
                />
              </div>

              {/* Seção de Retorno (O que dispara o alerta na Secretaria) */}
              <div className={`p-6 rounded-[30px] transition-all ${solicitarRetorno ? 'bg-orange-50 border border-orange-100' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-slate-300 text-orange-500 focus:ring-orange-200"
                      checked={solicitarRetorno}
                      onChange={(e) => setSolicitarRetorno(e.target.checked)}
                    />
                    <span className="text-xs font-black uppercase text-slate-600 italic">
                      Solicitar Retorno / Reagendamento
                    </span>
                  </label>
                  
                  {solicitarRetorno && (
                    <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                      <CalendarClock size={16} className="text-orange-500" />
                      <input
                        type="date"
                        className="bg-white border-none rounded-xl text-xs font-bold p-2 outline-none text-orange-600 shadow-sm"
                        value={dataRetorno}
                        onChange={(e) => setDataRetorno(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Botão Finalizar */}
              <button
                onClick={() => handleFinalizar(ag)}
                disabled={!relato}
                className={`w-full p-5 rounded-[25px] font-black uppercase italic tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${
                  relate 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 size={18} />
                Finalizar Atendimento e Enviar para Receção
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="p-20 text-center border-4 border-dashed border-slate-100 rounded-[50px]">
          <p className="text-slate-300 font-black italic uppercase tracking-widest">
            Nenhum paciente aguardando atendimento
          </p>
        </div>
      )}
    </div>
  );
}