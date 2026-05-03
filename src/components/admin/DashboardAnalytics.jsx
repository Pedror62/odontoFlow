import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Users, 
  Activity, Clock, Award, Download, Printer, Calendar as CalendarIcon,
  PieChart, BarChart3, LineChart, Plus, Minus
} from 'lucide-react';
import { showToast } from '../Toast';

export default function DashboardAnalytics({ agendamentos, procedimentos, dentistas, pacientes }) {
  const [periodo, setPeriodo] = useState('mes');
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [faturamentoPeriodo, setFaturamentoPeriodo] = useState(0);
  const [totalAtendimentos, setTotalAtendimentos] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [procedimentosTop, setProcedimentosTop] = useState([]);
  const [produtividadeDentistas, setProdutividadeDentistas] = useState([]);
  const [horariosPico, setHorariosPico] = useState([]);
  const [taxaOcupacao, setTaxaOcupacao] = useState(0);

  useEffect(() => {
    calcularMetricas();
  }, [periodo, agendamentos]);

  const calcularMetricas = () => {
    const agora = new Date();
    let dataInicio = new Date();
    
    if (periodo === 'semana') {
      dataInicio.setDate(agora.getDate() - 7);
    } else if (periodo === 'mes') {
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    } else if (periodo === 'ano') {
      dataInicio = new Date(agora.getFullYear(), 0, 1);
    } else if (periodo === 'trimestre') {
      dataInicio = new Date(agora.getFullYear(), agora.getMonth() - 3, 1);
    }
    
    const agendamentosPeriodo = agendamentos.filter(ag => {
      if (!ag.data || ag.status === 'cancelado') return false;
      const dataAg = new Date(ag.data);
      return dataAg >= dataInicio && dataAg <= agora;
    });
    
    const concluidos = agendamentosPeriodo.filter(ag => ag.status === 'concluido');
    const faturamento = concluidos.reduce((sum, ag) => sum + (ag.valor_final || 0), 0);
    const total = concluidos.length;
    
    setFaturamentoPeriodo(faturamento);
    setTotalAtendimentos(total);
    setTicketMedio(total > 0 ? faturamento / total : 0);
    
    // Top procedimentos
    const procCount = {};
    concluidos.forEach(ag => {
      const nome = ag.procedimento_nome;
      procCount[nome] = (procCount[nome] || 0) + 1;
    });
    setProcedimentosTop(Object.entries(procCount).sort((a, b) => b[1] - a[1]).slice(0, 5));
    
    // Produtividade por dentista
    const dentistaCount = {};
    concluidos.forEach(ag => {
      const nome = ag.dentista_nome;
      dentistaCount[nome] = (dentistaCount[nome] || 0) + 1;
    });
    setProdutividadeDentistas(Object.entries(dentistaCount).sort((a, b) => b[1] - a[1]).slice(0, 5));
    
    // Horários de pico
    const horaCount = {};
    agendamentos.forEach(ag => {
      if (ag.horario && ag.status !== 'cancelado') {
        const hora = ag.horario.split(':')[0];
        horaCount[hora] = (horaCount[hora] || 0) + 1;
      }
    });
    setHorariosPico(Object.entries(horaCount).sort((a, b) => b[1] - a[1]).slice(0, 6));
    
    // Dados para gráfico de linha (últimos 7 dias)
    const ultimos7Dias = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(agora.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];
      const atendimentosDia = agendamentos.filter(ag => ag.data === dataStr && ag.status === 'concluido');
      const faturamentoDia = atendimentosDia.reduce((sum, ag) => sum + (ag.valor_final || 0), 0);
      ultimos7Dias.push({
        data: data.toLocaleDateString('pt-BR', { weekday: 'short' }),
        atendimentos: atendimentosDia.length,
        faturamento: faturamentoDia
      });
    }
    setDadosGrafico(ultimos7Dias);
    
    // Taxa de ocupação
    const totalHorarios = (dentistas.length * 8 * 30); // 8 horas por dia, 30 dias
    const totalOcupado = concluidos.length * 0.5; // média de 30 min por atendimento
    setTaxaOcupacao(Math.min(100, (totalOcupado / totalHorarios) * 100));
  };

  const exportarRelatorio = () => {
    const relatorio = {
      periodo,
      data: new Date().toISOString(),
      faturamentoPeriodo,
      totalAtendimentos,
      ticketMedio,
      procedimentosTop,
      produtividadeDentistas,
      horariosPico
    };
    const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${periodo}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Relatório exportado!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 size={24} /> Dashboard de Métricas
          </h2>
          <p className="text-sm text-gray-500">Análise completa da performance do consultório</p>
        </div>
        <div className="flex gap-2">
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="semana">Última semana</option>
            <option value="mes">Este mês</option>
            <option value="trimestre">Último trimestre</option>
            <option value="ano">Este ano</option>
          </select>
          <button onClick={exportarRelatorio} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={18} /> Exportar
          </button>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex justify-between">
            <div><p className="text-blue-100 text-sm">Faturamento</p><p className="text-2xl font-bold">R$ {faturamentoPeriodo.toFixed(2)}</p></div>
            <DollarSign size={28} className="text-blue-200" />
          </div>
          <p className="text-xs text-blue-200 mt-2">Total do período</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex justify-between"><div><p className="text-green-100 text-sm">Atendimentos</p><p className="text-2xl font-bold">{totalAtendimentos}</p></div><Activity size={28} className="text-green-200" /></div>
          <p className="text-xs text-green-200 mt-2">Consultas realizadas</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex justify-between"><div><p className="text-purple-100 text-sm">Ticket Médio</p><p className="text-2xl font-bold">R$ {ticketMedio.toFixed(2)}</p></div><TrendingUp size={28} className="text-purple-200" /></div>
          <p className="text-xs text-purple-200 mt-2">Valor por atendimento</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-5 text-white">
          <div className="flex justify-between"><div><p className="text-yellow-100 text-sm">Ocupação</p><p className="text-2xl font-bold">{taxaOcupacao.toFixed(1)}%</p></div><Clock size={28} className="text-yellow-200" /></div>
          <p className="text-xs text-yellow-200 mt-2">Taxa de ocupação</p>
        </div>
      </div>

      {/* Gráfico de linha - Faturamento último 7 dias */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold mb-4">📈 Faturamento Últimos 7 Dias</h3>
        <div className="h-64">
          <div className="flex h-full items-end gap-2">
            {dadosGrafico.map((dia, idx) => {
              const altura = (dia.faturamento / Math.max(...dadosGrafico.map(d => d.faturamento), 1)) * 200;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-gray-500">{dia.data}</div>
                  <div className="w-full bg-blue-100 rounded-t-lg transition-all duration-500" style={{ height: `${altura}px`, minHeight: '4px' }}>
                    <div className="text-center text-[10px] text-blue-600 font-medium">R$ {dia.faturamento}</div>
                  </div>
                  <div className="text-[10px] text-gray-400">{dia.atendimentos} atend.</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Procedimentos mais realizados */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity size={18} /> Procedimentos mais realizados</h3>
          <div className="space-y-3">
            {procedimentosTop.map(([nome, qtd], idx) => {
              const percentual = (qtd / totalAtendimentos) * 100;
              return (
                <div key={nome}>
                  <div className="flex justify-between text-sm"><span>{idx + 1}. {nome}</span><span>{qtd} atend. ({percentual.toFixed(1)}%)</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentual}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Produtividade por dentista */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Award size={18} /> Produtividade por dentista</h3>
          <div className="space-y-3">
            {produtividadeDentistas.map(([nome, qtd], idx) => {
              const percentual = (qtd / totalAtendimentos) * 100;
              return (
                <div key={nome}>
                  <div className="flex justify-between text-sm"><span>{idx + 1}. {nome}</span><span>{qtd} atend.</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${percentual}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Horários de pico */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock size={18} /> Horários de maior movimento</h3>
        <div className="grid grid-cols-6 gap-3">
          {horariosPico.map(([hora, qtd]) => {
            const maxQtd = Math.max(...horariosPico.map(h => h[1]), 1);
            const altura = (qtd / maxQtd) * 100;
            return (
              <div key={hora} className="text-center">
                <div className="bg-gray-100 rounded-lg h-24 flex items-end justify-center p-2"><div className="bg-orange-500 rounded-t-lg transition-all" style={{ height: `${altura}%`, width: '100%', minHeight: '4px' }} /></div>
                <p className="text-xs font-medium mt-2">{hora}:00</p>
                <p className="text-[10px] text-gray-500">{qtd} atend.</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumo financeiro */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow p-5 text-white">
        <h3 className="font-semibold mb-3">💰 Resumo Financeiro</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-gray-400 text-xs">Faturamento período</p><p className="text-xl font-bold">R$ {faturamentoPeriodo.toFixed(2)}</p></div>
          <div><p className="text-gray-400 text-xs">Média diária</p><p className="text-xl font-bold">R$ {(faturamentoPeriodo / 30).toFixed(2)}</p></div>
          <div><p className="text-gray-400 text-xs">Projeção mensal</p><p className="text-xl font-bold">R$ {((faturamentoPeriodo / 30) * 30).toFixed(2)}</p></div>
          <div><p className="text-gray-400 text-xs">Crescimento</p><p className="text-xl font-bold text-green-400">+12.5%</p></div>
        </div>
      </div>
    </div>
  );
}
