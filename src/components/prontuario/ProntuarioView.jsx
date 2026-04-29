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
];

// Medicamentos pré-cadastrados
const MEDICAMENTOS = [
  { id: 1, nome: 'Amoxicilina', dosagem: '500mg', intervalo: '8/8h', duracao: '7 dias' },
  { id: 2, nome: 'Dipirona', dosagem: '500mg', intervalo: '6/6h', duracao: '3 dias' },
  { id: 3, nome: 'Ibuprofeno', dosagem: '400mg', intervalo: '8/8h', duracao: '5 dias' },
  { id: 4, nome: 'Nimesulida', dosagem: '100mg', intervalo: '12/12h', duracao: '3 dias' },
  { id: 5, nome: 'Paracetamol', dosagem: '750mg', intervalo: '6/6h', duracao: '3 dias' },
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
  const [prescricao, setPrescricaoForm] = useState({ medicamento: '', posologia: '', observacoes: '' });
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

  // Carregar histórico
  useEffect(() => {
    if (paciente) {
      const saved = localStorage.getItem(`prontuario_${paciente.id || paciente.nome}`);
      if (saved) {
        setHistorico(JSON.parse(saved));
      } else {
        const inicial = [{
          id: Date.now(),
          data: new Date().toLocaleString(),
          tipo: 'sistema',
          descricao: `Atendimento iniciado - ${atendimento?.procedimento_nome || 'Consulta'}`,
        }];
        setHistorico(inicial);
        localStorage.setItem(`prontuario_${paciente.id || paciente.nome}`, JSON.stringify(inicial));
      }
    }
  }, [paciente, atendimento?.procedimento_nome]);

  const salvarHistorico = (novoHistorico) => {
    setHistorico(novoHistorico);
    if (paciente) {
      localStorage.setItem(`prontuario_${paciente.id || paciente.nome}`, JSON.stringify(novoHistorico));
    }
  };

  const adicionarHistorico = (texto, tipo = 'manual') => {
    if (!texto.trim()) return;
    const novo = { 
      id: Date.now(), 
      data: new Date().toLocaleString(), 
      tipo, 
      descricao: texto 
    };
    salvarHistorico([novo, ...historico]);
    setNovaAnotacao('');
    showToast('Anotação adicionada!', 'success');
  };

  const aplicarTemplate = (template) => {
    adicionarHistorico(template.texto, 'manual');
    setShowTemplates(false);
  };

  const adicionarPrescricao = () => {
    if (!prescricao.medicamento) {
      showToast('Selecione um medicamento', 'error');
      return;
    }
    const text = `💊 Prescrição: ${prescricao.medicamento}\nPosologia: ${prescricao.posologia}\nObs: ${prescricao.observacoes}`;
    adicionarHistorico(text, 'manual');
    setShowPrescricao(false);
    setPrescricaoForm({ medicamento: '', posologia: '', observacoes: '' });
  };

  const solicitarRetorno = () => {
    if (!retornoData.data || !retornoData.horario) {
      showToast('Preencha data e horário', 'error');
      return;
    }
    const text = `📅 Retorno agendado para ${retornoData.data} às ${retornoData.horario} - Sala ${retornoData.sala}\nObs: ${retornoData.observacoes}`;
    adicionarHistorico(text, 'sistema');
    onPedirRetorno?.({ 
      paciente, 
      procedimento: atendimento?.procedimento_nome, 
      ...retornoData 
    });
    setShowRetornoForm(false);
    setRetornoData({ data: '', horario: '', sala: '', observacoes: '' });
    showToast('Retorno agendado!', 'success');
  };

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
    adicionarHistorico(`✅ Atendimento finalizado.\nMateriais: ${materiaisText}\nCusto: R$ ${custoTotal}`, 'sistema');
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
      adicionarHistorico(`📸 Exame/Imagem adicionado ao prontuário`, 'sistema');
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
            <button 
              onClick={() => {
                console.log('🔴 Botão PAUSAR clicado no ProntuarioView');
                if (onPausar) {
                  onPausar();
                } else {
                  console.log('⚠️ onPausar não está definido!');
                  showToast('Erro: função pausar não disponível', 'error');
                }
              }} 
              className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-yellow-600 transition"
            >
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
              {historico.map(reg => (
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
              ))}
            </div>
          </>
        )}

        {activeTab === 'exames' && (
          <div>
            <button 
              onClick={() => setShowUploadModal(true)} 
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <Upload size={14} /> Adicionar Exame
            </button>
            {imagensPaciente.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                <ImageIcon size={40} className="mx-auto mb-2" />
                <p>Nenhum exame adicionado</p>
                <p className="text-xs mt-1">Clique em "Adicionar Exame" para anexar raio-x ou fotos</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {imagensPaciente.map(img => (
                  <div key={img.id} className="relative group">
                    <img 
                      src={img.url} 
                      alt="Exame" 
                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition" 
                      onClick={() => setImagemSelecionada(img)} 
                    />
                    <button 
                      onClick={() => deletarImagem(img.id)} 
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modais - Templates, Prescrição, Retorno, Materiais, Imagens */}
      {/* ... (restante dos modais iguais ao seu código original) ... */}
      
      {/* Os modais de Templates, Prescrição, Retorno, Materiais e Upload de Imagem permanecem iguais */}
      {/* Para economizar espaço, mantenha os modais do seu código original aqui */}
      
    </div>
  );
}
