import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Users, Calendar, TrendingUp, Download, Printer, 
  Clock, Activity, BarChart3, PieChart, Timer, Award,
  AlertCircle, CheckCircle, XCircle, Zap
} from 'lucide-react';
import { showToast } from '../Toast';

export default function RelatoriosAdmin({ agendamentos, procedimentos, planos, pacientes }) {
  const [tempoMedioPorProcedimento, setTempoMedioPorProcedimento] = useState([]);
  const [tempoTotalAtendimentos, setTempoTotalAtendimentos] = useState(0);
  const [atendimentosPorHora, setAtendimentosPorHora] = useState([]);
  const [produtividadeDentistas, setProdutividadeDentistas] = useState([]);
  const [horarioPico, setHorarioPico] = useState('');

  // Calcular estatísticas de tempo
  useEffect(() => {
    // Tempo médio por procedimento
    const tempoPorProc = {};
    procedimentos.forEach(proc => {
      const agsDoProc = agendamentos.filter(ag => ag.procedimento_nome === proc.nome && ag.status === 'concluido');
      if (agsDoProc.length > 0) {
        tempoPorProc[proc.nome] = {
          nome: proc.nome,
          duracaoPadrao: proc.duracao || 30,
          quantidade: agsDoProc.length,
          tempoEstimadoTotal: (proc.duracao || 30) * agsDoProc.length
        };
      }
    });
    setTempoMedioPorProcedimento(Object.values(tempoPorProc));

    // Tempo total de atendimentos (estimado)
    const total = agendamentos
      .filter(ag => ag.status === 'concluido')
      .reduce((sum, ag) => {
        const proc = procedimentos.find(p => p.nome === ag.procedimento_nome);
        return sum + (proc?.duracao || 30);
      }, 0);
    setTempoTotalAtendimentos(total);

    // Atendimentos por hora do dia
    const horas = {};
    agendamentos.forEach(ag => {
      if (ag.horario) {
        const hora = ag.horario.split(':')[0];
        horas[hora] = (horas[hora] || 0) + 1;
      }
    });
    const horasArray = Object.entries(horas).map(([hora, qtd]) => ({ hora, qtd }));
    horasArray.sort((a, b) => b.qtd - a.qtd);
    setAtendimentosPorHora(horasArray);
    if (horasArray.length > 0) {
      setHorarioPico(`${horasArray[0].hora}:00 - ${parseInt(horasArray[0].hora) + 1}:00`);
    }

    // Produtividade por dentista
    const dentistasMap = {};
    agendamentos.forEach(ag => {
      if (ag.dentista_nome && ag.status === 'concluido') {
        if (!dentistasMap[ag.dentista_nome]) {
          dentistasMap[ag.dentista_nome] = {
            nome: ag.dentista_nome,
            total: 0,
            tempoTotal: 0
          };
        }
        dentistasMap[ag.dentista_nome].total++;
        const proc = procedimentos.find(p => p.nome === ag.procedimento_nome);
        dentistasMap[ag.dentista_nome].tempoTotal += (proc?.duracao || 30);
      }
    });
    setProdutividadeDentistas(Object.values(dentistasMap));
  }, [agendamentos, procedimentos]);

  // Calcular estatísticas financeiras
  const faturamentoTotal = agendamentos
    .filter(ag => ag.status !== 'cancelado')
    .reduce((sum, ag) => sum + (ag.valor_final || 0), 0);
  
  const faturamentoMes = agendamentos
    .filter(ag => {
      if (!ag.data) return false;
      const dataAg = new Date(ag.data);
      const hoje = new Date();
      return dataAg.getMonth() === hoje.getMonth() && 
             dataAg.getFullYear() === hoje.getFullYear() &&
             ag.status !== 'cancelado';
    })
    .reduce((sum, ag) => sum + (ag.valor_final || 0), 0);
  
  const aproveitamentoConsultorio = (agendamentos.filter(ag => ag.status === 'concluido').length / 
    (agendamentos.filter(ag => ag.status !== 'cancelado').length || 1)) * 100;

  const procedimentosMaisRealizados = () => {
    const contagem = {};
    agendamentos.forEach(ag => {
      const nome = ag.procedimento_nome;
      if (nome) contagem[nome] = (contagem[nome] || 0) + 1;
    });
    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const planosMaisUsados = () => {
    const contagem = {};
    agendamentos.forEach(ag => {
      const nome = ag.plano_nome || 'Não informado';
      contagem[nome] = (contagem[nome] || 0) + 1;
    });
    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const handleExportRelatorio = () => {
    const relatorio = {
      data: new Date().toISOString(),
      estatisticasGerais: {
        totalPacientes: pacientes.length,
        totalAgendamentos: agendamentos.length,
        faturamentoTotal,
        faturamentoMes,
        mediaPorAtendimento: agendamentos.length > 0 ? faturamentoTotal / agendamentos.length : 0,
        tempoTotalAtendimentos: `${Math.floor(tempoTotalAtendimentos / 60)}h ${tempoTotalAtendimentos % 60}min`,
        aproveitamentoConsultorio: `${aproveitamentoConsultorio.toFixed(1)}%`,
        horarioPico
      },
      tempoMedioPorProcedimento,
      produtividadePorDentista: produtividadeDentistas,
      procedimentosMaisRealizados: procedimentosMaisRealizados(),
      planosMaisUsados: planosMaisUsados()
    };
    
    console.log('Relatório exportado:', relatorio);
    showToast('Relatório gerado! Verifique o console para dados completos.', 'success');
  };

  const formatarTempo = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) return `${mins} minutos`;
    return `${horas}h ${mins}min`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 size={24} /> Dashboard de Relatórios
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Análise completa de desempenho, tempo de atendimento e produtividade
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportRelatorio}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={18} /> Exportar Relatório
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Printer size={18} /> Imprimir
          </button>
        </div>
      </div>

      {/* Cards de Resumo de Tempo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Tempo Total de Atendimento</p>
              <p className="text-2xl font-bold mt-1">{formatarTempo(tempoTotalAtendimentos)}</p>
            </div>
            <Timer size={32} className="text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Média por Atendimento</p>
              <p className="text-2xl font-bold mt-1">
                {formatarTempo(Math.round(tempoTotalAtendimentos / (agendamentos.filter(ag => ag.status === 'concluido').length || 1)))}
              </p>
            </div>
            <Clock size={32} className="text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Horário de Pico</p>
              <p className="text-2xl font-bold mt-1">{horarioPico || 'N/A'}</p>
            </div>
            <Zap size={32} className="text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Aproveitamento</p>
              <p className="text-2xl font-bold mt-1">{aproveitamentoConsultorio.toFixed(1)}%</p>
            </div>
            <Activity size={32} className="text-yellow-200" />
          </div>
        </div>
      </div>

      {/* Gráfico de Tempo Médio por Procedimento */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={20} /> Tempo Médio por Procedimento
        </h3>
        <div className="space-y-4">
          {tempoMedioPorProcedimento.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
          ) : (
            tempoMedioPorProcedimento.map((proc, index) => (
              <div key={proc.nome}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{proc.nome}</span>
                  <span className="text-gray-600">
                    {proc.quantidade} atendimentos | {formatarTempo(proc.duracaoPadrao)} por atendimento
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min((proc.tempoEstimadoTotal / tempoTotalAtendimentos) * 100, 100)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tempo total estimado: {formatarTempo(proc.tempoEstimadoTotal)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Produtividade dos Dentistas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Award size={20} /> Produtividade por Dentista
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtividadeDentistas.length === 0 ? (
            <p className="text-gray-500 text-center col-span-full py-4">Nenhum dado disponível</p>
          ) : (
            produtividadeDentistas.map(dentista => (
              <div key={dentista.nome} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{dentista.nome}</h4>
                  <span className="text-2xl font-bold text-blue-600">{dentista.total}</span>
                </div>
                <p className="text-sm text-gray-600">atendimentos realizados</p>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    Tempo total: {formatarTempo(dentista.tempoTotal)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Média por atendimento: {formatarTempo(Math.round(dentista.tempoTotal / dentista.total))}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Distribuição de Atendimentos por Hora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={20} /> Distribuição por Horário
          </h3>
          <div className="space-y-3">
            {atendimentosPorHora.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
            ) : (
              atendimentosPorHora.map(({ hora, qtd }) => {
                const maxQtd = Math.max(...atendimentosPorHora.map(h => h.qtd));
                return (
                  <div key={hora}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{hora}:00 - {parseInt(hora) + 1}:00</span>
                      <span className="font-semibold">{qtd} atendimentos</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(qtd / maxQtd) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Procedimentos Mais Realizados */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={20} /> Procedimentos Mais Realizados
          </h3>
          <div className="space-y-3">
            {procedimentosMaisRealizados().length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
            ) : (
              procedimentosMaisRealizados().map(([nome, quantidade], index) => {
                const maxQtd = procedimentosMaisRealizados()[0][1];
                return (
                  <div key={nome}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{index + 1}. {nome}</span>
                      <span className="font-semibold">{quantidade} atendimentos</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(quantidade / maxQtd) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Agendamentos Recentes com Tempo */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={20} /> Últimos Agendamentos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm">Data</th>
                <th className="px-4 py-2 text-left text-sm">Horário</th>
                <th className="px-4 py-2 text-left text-sm">Paciente</th>
                <th className="px-4 py-2 text-left text-sm">Procedimento</th>
                <th className="px-4 py-2 text-left text-sm">Dentista</th>
                <th className="px-4 py-2 text-left text-sm">Duração</th>
                <th className="px-4 py-2 text-left text-sm">Status</th>
                <th className="px-4 py-2 text-left text-sm">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {agendamentos.slice(0, 10).map(ag => {
                const proc = procedimentos.find(p => p.nome === ag.procedimento_nome);
                return (
                  <tr key={ag.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{ag.data || '-'}</td>
                    <td className="px-4 py-2 text-sm">{ag.horario || '-'}</td>
                    <td className="px-4 py-2 text-sm font-medium">{ag.paciente_nome || '-'}</td>
                    <td className="px-4 py-2 text-sm">{ag.procedimento_nome || '-'}</td>
                    <td className="px-4 py-2 text-sm">{ag.dentista_nome || '-'}</td>
                    <td className="px-4 py-2 text-sm">{proc?.duracao ? `${proc.duracao} min` : '-'}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        ag.status === 'concluido' ? 'bg-green-100 text-green-700' :
                        ag.status === 'pausado' ? 'bg-yellow-100 text-yellow-700' :
                        ag.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {ag.status === 'concluido' ? 'Concluído' :
                         ag.status === 'pausado' ? 'Pausado' :
                         ag.status === 'cancelado' ? 'Cancelado' : 'Agendado'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-green-600 font-semibold">
                      R$ {ag.valor_final?.toFixed(2) || '0,00'}
                    </td>
                  </tr>
                );
              })}
              {agendamentos.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    Nenhum agendamento realizado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo de Indicadores */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg shadow p-6 text-white">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} /> Indicadores de Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-400 text-sm">Eficiência do Consultório</p>
            <p className="text-2xl font-bold">{aproveitamentoConsultorio.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">
              {aproveitamentoConsultorio > 80 ? 'Excelente! 🎉' : 
               aproveitamentoConsultorio > 60 ? 'Bom 👍' : 
               'Pode melhorar 📈'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Ticket Médio</p>
            <p className="text-2xl font-bold">
              R$ {(agendamentos.length > 0 ? faturamentoTotal / agendamentos.length : 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Tempo Médio de Atendimento</p>
            <p className="text-2xl font-bold">
              {formatarTempo(Math.round(tempoTotalAtendimentos / (agendamentos.filter(ag => ag.status === 'concluido').length || 1)))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}