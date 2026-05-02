import React, { useState, useEffect } from 'react';
import { 
  History, Clock, FileText, Activity, Play, Pause, 
  Plus, Calendar as CalendarIcon, Save, Printer, 
  CheckCircle, X, Camera, Upload, Image as ImageIcon,
  Pill, Stethoscope, AlertCircle, Trash2, ZoomIn,
  List, Clipboard, FileWarning
} from 'lucide-react';
import { showToast } from '../Toast';
import { useMaterial } from '../../contexts/MaterialContext';
import { useData } from '../../contexts/DataContext';

// Templates de anotações
const TEMPLATES = [
  { id: 1, titulo: '🦷 Limpeza', texto: 'Realizada profilaxia e aplicação tópica de flúor. Paciente orientado sobre escovação e uso do fio dental. Sem intercorrências.' },
  { id: 2, titulo: '🦷 Canal', texto: 'Tratamento de canal realizado com sucesso. Radiografia final confirma obturação dentro dos parâmetros. Paciente tolerou bem o procedimento.' },
  { id: 3, titulo: '🦷 Extração', texto: 'Exodontia realizada sob anestesia local. Paciente orientado sobre cuidados pós-operatórios. Gelo local nas primeiras 24h.' },
  { id: 4, titulo: '🦷 Restauração', texto: 'Restauração em resina composta realizada. Ajuste oclusal e acabamento realizados. Paciente satisfeito.' },
  { id: 5, titulo: '💊 Prescrição', texto: 'Prescrito medicação conforme necessidade. Orientações sobre posologia e possíveis efeitos colaterais.' },
  { id: 6, titulo: '📝 Exame', texto: 'Solicitado exame de Raio-X panorâmico. Paciente encaminhado para realização do exame.' },
  { id: 7, titulo: '🦷 Endodontia', texto: 'Tratamento endodôntico iniciado. Canal preparado com limas manuais e rotatórias. Curativo de demora.' },
];

// Medicamentos pré-cadastrados
const MEDICAMENTOS = [
  { id: 1, nome: 'Amoxicilina', dosagem: '500mg', intervalo: '8/8h', duracao: '7 dias', indicacao: 'Infecções bacterianas' },
  { id: 2, nome: 'Dipirona', dosagem: '500mg', intervalo: '6/6h', duracao: '3 dias', indicacao: 'Dor e febre' },
  { id: 3, nome: 'Ibuprofeno', dosagem: '400mg', intervalo: '8/8h', duracao: '5 dias', indicacao: 'Anti-inflamatório' },
  { id: 4, nome: 'Nimesulida', dosagem: '100mg', intervalo: '12/12h', duracao: '3 dias', indicacao: 'Anti-inflamatório' },
  { id: 5, nome: 'Paracetamol', dosagem: '750mg', intervalo: '6/6h', duracao: '3 dias', indicacao: 'Dor' },
  { id: 6, nome: 'Cloridrato de Lidocaína', dosagem: '2%', intervalo: 'Uso tópico', duracao: '', indicacao: 'Anestesia local' },
  { id: 7, nome: 'Dexametasona', dosagem: '4mg', intervalo: '12/12h', duracao: '2 dias', indicacao: 'Anti-inflamatório' },
];

export default function ProntuarioView({ 
  paciente, 
  atendimento, 
  onPausar, 
  onRetomar,
  onPedirRetorno,
  onFinalizar
}) {
  const { consumirMateriais } = useMaterial();
  const { procedimentos, imagens, adicionarImagem, deletarImagem } = useData();
  
  const [historico, setHistorico] = useState([]);
  const [novaAnotacao, setNovaAnotacao] = useState('');
  const [showRetornoForm, setShowRetornoForm] = useState(false);
  const [showMateriaisModal, setShowMateriaisModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPrescricao, setShowPrescricao] = useState(false);
  const [activeTab, setActiveTab] = useState('historico');
  const [materiaisConsumidos, setMateriaisConsumidos] = useState(null);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [prescricao, setPrescricaoForm] = useState({ medicamento: '', posologia: '', observacoes: '', indicacao: '' });
  const [retornoData, setRetornoData] = useState({ data: '', horario: '', sala: '', observacoes: '' });
  const [tempoAtendimento, setTempoAtendimento] = useState(0);
  const [tempoEstimado, setTempoEstimado] = useState(30);
  const [timerAtivo, setTimerAtivo] = useState(false);

  // Timer do atendimento
  useEffect(() => {
    let timer;
    if (atendimento && atendimento.status === 'em_andamento' && !timerAtivo) {
      setTimerAtivo(true);
      timer = setInterval(() => {
        setTempoAtendimento(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
        setTimerAtivo(false);
      }
    };
  }, [atendimento, atendimento?.status]);

  // Buscar tempo estimado do procedimento
  useEffect(() => {
    if (atendimento?.procedimento_nome) {
      const proc = procedimentos?.find(p => p.nome === atendimento.procedimento_nome);
      if (proc && proc.duracao) setTempoEstimado(proc.duracao);
    }
  }, [atendimento, procedimentos]);

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tempoDecorrido = formatarTempo(tempoAtendimento);
  const percentualTempo = (tempoAtendimento / (tempoEstimado * 60)) * 100;
  const estaUltrapassando = percentualTempo > 100;

  const imagensPaciente = (imagens || []).filter(img => 
    img.paciente_id === paciente?.id || img.paciente_nome === paciente?.nome
  );

  // Carregar histórico - CORRIGIDO
  useEffect(() => {
    if (paciente) {
      const storageKey = `prontuario_${paciente.id || paciente.nome}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setHistorico(JSON.parse(saved));
        } catch(e) {
          console.error('Erro ao carregar histórico:', e);
          setHistorico([]);
        }
      } else {
        const inicial = [{
          id: Date.now(),
          data: new Date().toLocaleString(),
          tipo: 'sistema',
          descricao: `Atendimento iniciado - ${atendimento?.procedimento_nome || 'Consulta'}`,
        }];
        setHistorico(inicial);
        localStorage.setItem(storageKey, JSON.stringify(inicial));
      }
    }
  }, [paciente, atendimento?.procedimento_nome]);

  const salvarHistorico = (novoHistorico) => {
    setHistorico(novoHistorico);
    if (paciente) {
      const storageKey = `prontuario_${paciente.id || paciente.nome}`;
      localStorage.setItem(storageKey, JSON.stringify(novoHistorico));
    }
  };

  const adicionarHistorico = (texto, tipo = 'manual') => {
    if (!texto.trim()) {
      showToast('Digite um texto para adicionar', 'error');
      return;
    }
    
    const novo = { 
      id: Date.now(), 
      data: new Date().toLocaleString(), 
      tipo, 
      descricao: texto 
    };
    const novoHistorico = [novo, ...historico];
    salvarHistorico(novoHistorico);
    setNovaAnotacao('');
    showToast('Anotação adicionada ao prontuário!', 'success');
  };

  // FUNÇÃO CORRIGIDA - Templates
  const aplicarTemplate = (template) => {
    console.log('📝 Aplicando template:', template.titulo);
    adicionarHistorico(template.texto, 'manual');
    setShowTemplates(false);
  };

  // FUNÇÃO CORRIGIDA - Prescrição
  const adicionarPrescricao = () => {
    if (!prescricao.medicamento) {
      showToast('Selecione um medicamento', 'error');
      return;
    }
    
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const dentistaNome = atendimento?.dentista_nome || 'Dr(a).';
    
    const text = `💊 PRESCRIÇÃO MÉDICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Paciente: ${paciente?.nome}
Data: ${dataAtual}
Medicamento: ${prescricao.medicamento}
${prescricao.posologia ? `Posologia: ${prescricao.posologia}` : ''}
${prescricao.indicacao ? `Indicação: ${prescricao.indicacao}` : ''}
${prescricao.observacoes ? `Observações: ${prescricao.observacoes}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Assinatura: ${dentistaNome}
CRM/ CRO: _____________`;
    
    adicionarHistorico(text, 'manual');
    setShowPrescricao(false);
    setPrescricaoForm({ medicamento: '', posologia: '', observacoes: '', indicacao: '' });
  };

  // FUNÇÃO CORRIGIDA - Retorno
  const solicitarRetorno = () => {
    if (!retornoData.data || !retornoData.horario) {
      showToast('Preencha data e horário do retorno', 'error');
      return;
    }
    
    const dataFormatada = new Date(retornoData.data).toLocaleDateString('pt-BR');
    const text = `📅 RETORNO AGENDADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Paciente: ${paciente?.nome}
Data do Retorno: ${dataFormatada}
Horário: ${retornoData.horario}
Sala: ${retornoData.sala || 'A definir'}
${retornoData.observacoes ? `Observações: ${retornoData.observacoes}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Motivo: ${atendimento?.procedimento_nome || 'Avaliação'}`;
    
    adicionarHistorico(text, 'sistema');
    
    // Chamar função do dentista dashboard
    if (onPedirRetorno) {
      onPedirRetorno({ 
        paciente: paciente, 
        procedimento: atendimento?.procedimento_nome, 
        data: retornoData.data, 
        horario: retornoData.horario, 
        sala: retornoData.sala, 
        observacoes: retornoData.observacoes 
      });
    }
    
    setShowRetornoForm(false);
    setRetornoData({ data: '', horario: '', sala: '', observacoes: '' });
  };

  // FUNÇÃO CORRIGIDA - Finalizar com materiais
  const finalizarComMateriais = async () => {
    if (!atendimento) {
      showToast('Nenhum atendimento ativo', 'error');
      return;
    }

    let procId = atendimento.procedimento_id;
    if (!procId) {
      const proc = procedimentos?.find(p => p.nome === atendimento.procedimento_nome);
      procId = proc?.id;
    }
    
    if (!procId) {
      showToast('Procedimento não identificado', 'error');
      return;
    }

    let salaNum = String(atendimento.sala || '01').trim();
    const match = salaNum.match(/\d+/);
    salaNum = match ? match[0].padStart(2, '0') : '01';
    
    const result = await consumirMateriais(
      procId, 
      salaNum, 
      paciente?.nome || paciente?.paciente_nome, 
      atendimento.dentista_nome
    );
    
    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }
    
    setMateriaisConsumidos(result.consumo);
    setShowMateriaisModal(true);
    
    const materiaisText = result.consumo.map(m => `${m.materialNome}: ${m.quantidade} un`).join(', ');
    const custoTotal = result.consumo.reduce((s, i) => s + i.custo, 0).toFixed(2);
    adicionarHistorico(`✅ ATENDIMENTO FINALIZADO\nMateriais utilizados: ${materiaisText}\nCusto total de materiais: R$ ${custoTotal}`, 'sistema');
    showToast(`Atendimento finalizado! Custo materiais: R$ ${custoTotal}`, 'success');
    
    setTimeout(() => {
      setShowMateriaisModal(false);
      onFinalizar?.();
    }, 2000);
  };

  // Função para adicionar imagem
  const handleAddImagem = () => {
    if (!uploadPreview) return;
    setUploading(true);
    setTimeout(() => {
      const novaImagem = { 
        id: Date.now(), 
        url: uploadPreview, 
        paciente_id: paciente.id,
        paciente_nome: paciente.nome,
        data: new Date().toISOString() 
      };
      adicionarImagem(novaImagem);
      adicionarHistorico(`📸 EXAME ADICIONADO - ${new Date().toLocaleDateString()}\nImagem anexada ao prontuário do paciente.`, 'sistema');
      setUploading(false);
      setShowUploadModal(false);
      setUploadPreview(null);
      showToast('Imagem salva!', 'success');
    }, 1000);
  };

  if (!paciente) {
    return (
      <div className="bg-white rounded-xl shadow h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <FileText size={64} className="mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhum atendimento selecionado</p>
          <p className="text-sm mt-2">Clique em um paciente na agenda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow h-full flex flex-col overflow-hidden">
      {/* Header com Timer */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{paciente.nome || paciente.paciente_nome}</h2>
            <div className="flex gap-3 mt-1 text-sm text-gray-500 flex-wrap">
              {paciente.telefone && <span>📞 {paciente.telefone}</span>}
              {paciente.convenio && <span>🏥 {paciente.convenio}</span>}
              <span>🦷 {atendimento?.procedimento_nome || 'Consulta'}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={onPausar} className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-yellow-600 transition">
              <Pause size={14} /> Pausar
            </button>
            <button onClick={() => setShowTemplates(true)} className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-gray-600 transition">
              <FileText size={14} /> Templates
            </button>
            <button onClick={() => setShowPrescricao(true)} className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-purple-600 transition">
              <Pill size={14} /> Prescrever
            </button>
            <button onClick={() => setShowRetornoForm(true)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-blue-600 transition">
              <CalendarIcon size={14} /> Retorno
            </button>
            <button onClick={finalizarComMateriais} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-green-600 transition">
              <CheckCircle size={14} /> Finalizar
            </button>
          </div>
        </div>
        {/* Timer Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>⏱️ Tempo de atendimento: {tempoDecorrido}</span>
            <span>⏳ Estimado: {tempoEstimado} min</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${estaUltrapassando ? 'bg-red-500' : 'bg-green-500'}`} 
              style={{ width: `${Math.min(percentualTempo, 100)}%` }} 
            />
          </div>
          {estaUltrapassando && <p className="text-xs text-red-500 mt-1">⚠️ Tempo estimado ultrapassado!</p>}
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b bg-gray-50">
        <button 
          onClick={() => setActiveTab('historico')} 
          className={`flex-1 px-4 py-2 text-sm font-medium transition ${activeTab === 'historico' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <History size={14} className="inline mr-1" /> Histórico
        </button>
        <button 
          onClick={() => setActiveTab('exames')} 
          className={`flex-1 px-4 py-2 text-sm font-medium transition ${activeTab === 'exames' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Camera size={14} className="inline mr-1" /> Exames ({imagensPaciente.length})
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'historico' && (
          <>
            <div className="mb-4">
              <textarea 
                value={novaAnotacao} 
                onChange={(e) => setNovaAnotacao(e.target.value)} 
                placeholder="Digite suas observações clínicas..." 
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500" 
                rows="2" 
              />
              <button 
                onClick={() => adicionarHistorico(novaAnotacao)} 
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Save size={14} /> Salvar
              </button>
            </div>
            <div className="space-y-3">
              {historico.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Nenhum registro no prontuário</div>
              ) : (
                historico.map(reg => (
                  <div key={reg.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-white rounded-r-lg">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 flex-wrap">
                      <Clock size={10} />
                      <span>{reg.data}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${reg.tipo === 'sistema' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {reg.tipo === 'sistema' ? '🤖 Sistema' : '📝 Manual'}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{reg.descricao}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'exames' && (
          <div>
            <button onClick={() => setShowUploadModal(true)} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 transition">
              <Upload size={14} /> Adicionar Exame
            </button>
            {imagensPaciente.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                <ImageIcon size={40} className="mx-auto mb-2" />
                <p>Nenhum exame adicionado</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {imagensPaciente.map(img => (
                  <div key={img.id} className="relative group">
                    <img src={img.url} className="w-full h-24 object-cover rounded-lg cursor-pointer" onClick={() => setImagemSelecionada(img)} />
                    <button onClick={() => deletarImagem(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Templates */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">📋 Templates de Anotações</h3>
              <button onClick={() => setShowTemplates(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {TEMPLATES.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => aplicarTemplate(t)} 
                  className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition border border-gray-100"
                >
                  <p className="font-medium">{t.titulo}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.texto.substring(0, 80)}...</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Prescrição */}
      {showPrescricao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">💊 Prescrição Médica</h3>
              <button onClick={() => setShowPrescricao(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <select 
                value={prescricao.medicamento} 
                onChange={(e) => {
                  const selectedMed = MEDICAMENTOS.find(m => `${m.nome} ${m.dosagem}` === e.target.value);
                  setPrescricaoForm({
                    ...prescricao, 
                    medicamento: e.target.value,
                    indicacao: selectedMed?.indicacao || ''
                  });
                }} 
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Selecione um medicamento</option>
                {MEDICAMENTOS.map(m => (
                  <option key={m.id} value={`${m.nome} ${m.dosagem}`}>
                    {m.nome} {m.dosagem} - {m.indicacao}
                  </option>
                ))}
              </select>
              <textarea 
                placeholder="Posologia (ex: Tomar 1 comprimido de 8/8h)" 
                value={prescricao.posologia} 
                onChange={(e) => setPrescricaoForm({...prescricao, posologia: e.target.value})} 
                className="w-full p-2 border rounded-lg" 
                rows="2" 
              />
              <textarea 
                placeholder="Observações" 
                value={prescricao.observacoes} 
                onChange={(e) => setPrescricaoForm({...prescricao, observacoes: e.target.value})} 
                className="w-full p-2 border rounded-lg" 
                rows="2" 
              />
            </div>
            <div className="p-4 border-t flex gap-2">
              <button onClick={adicionarPrescricao} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">Adicionar Prescrição</button>
              <button onClick={() => setShowPrescricao(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Retorno */}
      {showRetornoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">📅 Agendar Retorno</h3>
              <button onClick={() => setShowRetornoForm(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <input 
                type="date" 
                value={retornoData.data} 
                onChange={(e) => setRetornoData({...retornoData, data: e.target.value})} 
                className="w-full p-2 border rounded-lg" 
                min={new Date().toISOString().split('T')[0]} 
              />
              <input 
                type="time" 
                value={retornoData.horario} 
                onChange={(e) => setRetornoData({...retornoData, horario: e.target.value})} 
                className="w-full p-2 border rounded-lg" 
              />
              <input 
                type="text" 
                placeholder="Sala (opcional)" 
                value={retornoData.sala} 
                onChange={(e) => setRetornoData({...retornoData, sala: e.target.value})} 
                className="w-full p-2 border rounded-lg" 
              />
              <textarea 
                placeholder="Observações" 
                value={retornoData.observacoes} 
                onChange={(e) => setRetornoData({...retornoData, observacoes: e.target.value})} 
                className="w-full p-2 border rounded-lg" 
                rows="2" 
              />
            </div>
            <div className="p-4 border-t flex gap-2">
              <button onClick={solicitarRetorno} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Confirmar Retorno</button>
              <button onClick={() => setShowRetornoForm(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Materiais Consumidos */}
      {showMateriaisModal && materiaisConsumidos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b bg-green-50 flex justify-between items-center">
              <h3 className="font-semibold text-green-700">✅ Materiais Consumidos</h3>
              <button onClick={() => setShowMateriaisModal(false)} className="text-green-600 hover:text-green-800"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {materiaisConsumidos.map((m, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">{m.materialNome}</span>
                  <span>{m.quantidade} un - R$ {m.custo.toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 border-t font-bold flex justify-between">
                <span>Total:</span>
                <span className="text-green-600">R$ {materiaisConsumidos.reduce((s, m) => s + m.custo, 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="p-4 border-t">
              <button onClick={() => { setShowMateriaisModal(false); }} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualização Imagem */}
      {imagemSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <button onClick={() => setImagemSelecionada(null)} className="absolute top-4 right-4 text-white"><X size={32} /></button>
          <img src={imagemSelecionada.url} className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {/* Modal Upload Imagem */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">📸 Adicionar Exame</h3>
              <button onClick={() => setShowUploadModal(false)}><X size={20} /></button>
            </div>
            <div className="p-4">
              {uploadPreview ? (
                <img src={uploadPreview} className="w-full h-48 object-cover rounded-lg mb-3" />
              ) : (
                <label className="border-2 border-dashed rounded-lg p-8 text-center block cursor-pointer hover:border-blue-500 transition">
                  <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                  <p className="text-gray-500">Clique para selecionar uma imagem</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG até 5MB</p>
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = () => setUploadPreview(r.result); r.readAsDataURL(f); } }} className="hidden" />
                </label>
              )}
            </div>
            <div className="p-4 border-t flex gap-2">
              {uploadPreview && <button onClick={handleAddImagem} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{uploading ? 'Enviando...' : 'Salvar'}</button>}
              <button onClick={() => setShowUploadModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
