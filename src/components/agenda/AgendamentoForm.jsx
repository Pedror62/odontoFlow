// Função para encontrar próximo horário disponível
const encontrarProximoHorarioDisponivel = () => {
  if (!quickAgendamento.dentista_id || !quickAgendamento.procedimento_id) {
    showToast('Selecione dentista e procedimento primeiro', 'error');
    return;
  }
  
  const procedimento = procedimentos.find(p => p.id == quickAgendamento.procedimento_id);
  const duracao = procedimento?.duracao || 30;
  const dataSelecionada = quickAgendamento.data;
  
  // Filtrar agendamentos do mesmo dentista e mesma data
  const agendamentosDentista = agendamentos.filter(ag => 
    ag.dentista_id == quickAgendamento.dentista_id && 
    ag.data === dataSelecionada &&
    ag.status !== 'cancelado'
  );
  
  // Horários padrão (08:00 às 18:00)
  const horariosDisponiveis = [];
  for (let hora = 8; hora <= 18; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 30) {
      const horario = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
      const inicio = horarioParaMinutos(horario);
      const fim = inicio + duracao;
      
      let conflito = false;
      for (const ag of agendamentosDentista) {
        const agDuracao = procedimentos.find(p => p.id == ag.procedimento_id)?.duracao || 30;
        const agInicio = horarioParaMinutos(ag.horario);
        const agFim = agInicio + agDuracao;
        
        if (inicio < agFim && fim > agInicio) {
          conflito = true;
          break;
        }
      }
      
      if (!conflito && fim <= 19 * 60) { // Não passar das 19:00
        horariosDisponiveis.push(horario);
      }
    }
  }
  
  if (horariosDisponiveis.length > 0) {
    setQuickAgendamento({...quickAgendamento, horario: horariosDisponiveis[0]});
    showToast(`Próximo horário disponível: ${horariosDisponiveis[0]}`, 'success');
  } else {
    showToast('Não há horários disponíveis nesta data', 'error');
  }
};

// Adicione no formulário um botão:
<button
  type="button"
  onClick={encontrarProximoHorarioDisponivel}
  className="text-blue-600 text-xs hover:underline flex items-center gap-1"
>
  <Zap size={12} /> Encontrar próximo horário
</button>
