import React, { useState, useEffect } from 'react';
import { 
  Settings, DollarSign, Users, Calendar, TrendingUp, 
  LogOut, Shield, Activity, CreditCard, FileText, 
  Package, Scissors, MapPin, History, BarChart3, AlertTriangle,
  Menu, X, Home, Eye, PieChart, LineChart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useMaterial } from '../../contexts/MaterialContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../Toast';
import ProcedimentosManager from '../admin/ProcedimentosManager';
import PlanosManager from '../admin/PlanosManager';
import RelatoriosAdmin from '../admin/RelatoriosAdmin';
import EstoqueManager from '../admin/EstoqueManager';
import MateriaisProcedimento from '../admin/MateriaisProcedimento';
import DistribuicaoSala from '../admin/DistribuicaoSala';
import HistoricoConsumo from '../admin/HistoricoConsumo';
import NotificationCenter from '../notifications/NotificationCenter';
import VisualizarProntuario from '../admin/VisualizarProntuario';
import DashboardAnalytics from '../admin/DashboardAnalytics';

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prontuarioView, setProntuarioView] = useState(null);
  
  // Usando dados do contexto global
  const {
    procedimentos,
    adicionarProcedimento,
    atualizarProcedimento,
    deletarProcedimento,
    planos,
    adicionarPlano,
    atualizarPlano,
    deletarPlano,
    agendamentos,
    pacientes,
    dentistas 
  } = useData();
  
  // Usando dados do contexto de materiais
  const {
    materiais,
    materiaisPorProcedimento,
    distribuicaoSala,
    historicoConsumo,
    adicionarEstoque,
    setMateriais,
    setMateriaisPorProcedimento,
    reporMaterialSala
  } = useMaterial();
  
  // Usando contexto de notificações
  const {
    verificarEstoqueBaixo,
    verificarRetornosPendentes,
    adicionarNotificacao
  } = useNotification();
  
  // Estado local para controle
  const [stats, setStats] = useState({
    totalProcedimentos: 0,
    totalPlanos: 0,
    totalPacientes: 0,
    totalAgendamentos: 0,
    faturamentoTotal: 0,
    faturamentoMes: 0,
    agendamentosHoje: 0,
    totalMateriais: 0,
    materiaisEstoqueBaixo: 0,
    valorEstoque: 0
  });

  // Itens do menu lateral - Adicionado Analytics
  const menuItems = [
    { id: 'analytics', label: 'Dashboard', icon: BarChart3, color: 'teal' },
    { id: 'procedimentos', label: 'Procedimentos', icon: Activity, color: 'blue' },
    { id: 'planos', label: 'Planos de Saúde', icon: CreditCard, color: 'green' },
    { id: 'estoque', label: 'Estoque', icon: Package, color: 'indigo' },
    { id: 'materiais-procedimento', label: 'Materiais por Proced.', icon: Scissors, color: 'purple' },
    { id: 'distribuicao', label: 'Distribuição por Sala', icon: MapPin, color: 'orange' },
    { id: 'historico-consumo', label: 'Histórico de Consumo', icon: History, color: 'red' },
    { id: 'relatorios', label: 'Relatórios', icon: TrendingUp, color: 'teal' },
    { id: 'pacientes', label: 'Pacientes', icon: Users, color: 'green' },
  ];

  // Calcular estatísticas quando os dados mudarem
  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    
    const agendamentosMes = agendamentos.filter(ag => {
      if (!ag.data) return false;
      const dataAg = new Date(ag.data);
      const dataAtual = new Date();
      return dataAg.getMonth() === dataAtual.getMonth() && 
             dataAg.getFullYear() === dataAtual.getFullYear() &&
             ag.status !== 'cancelado';
    });
    
    const agendamentosHoje = agendamentos.filter(ag => ag.data === hoje);
    
    setStats({
      totalProcedimentos: procedimentos.length,
      totalPlanos: planos.length,
      totalPacientes: pacientes.length,
      totalAgendamentos: agendamentos.length,
      faturamentoTotal: agendamentos
        .filter(ag => ag.status !== 'cancelado')
        .reduce((sum, ag) => sum + (ag.valor_final || 0), 0),
      faturamentoMes: agendamentosMes.reduce((sum, ag) => sum + (ag.valor_final || 0), 0),
      agendamentosHoje: agendamentosHoje.length,
      totalMateriais: materiais.length,
      materiaisEstoqueBaixo: materiais.filter(m => m.estoque <= m.estoqueMinimo).length,
      valorEstoque: materiais.reduce((sum, m) => sum + (m.estoque * m.custoUnitario), 0)
    });
  }, [procedimentos, planos, pacientes, agendamentos, materiais]);

  // Verificar alertas periodicamente
  useEffect(() => {
    if (materiais && distribuicaoSala) {
      verificarEstoqueBaixo(materiais, distribuicaoSala);
    }
    if (agendamentos) {
      verificarRetornosPendentes(agendamentos);
    }
  }, [materiais, distribuicaoSala, agendamentos, verificarEstoqueBaixo, verificarRetornosPendentes]);

  const handleLogout = () => {
    logout();
    showToast('Logout realizado com sucesso!', 'success');
    navigate('/login');
  };

  const handleSaveProcedimento = (procedimento) => {
    const exists = procedimentos.find(p => p.id === procedimento.id);
    if (exists) {
      atualizarProcedimento(procedimento);
      showToast('Procedimento atualizado!', 'success');
      adicionarNotificacao(
        'Procedimento Atualizado',
        `${procedimento.nome} foi atualizado no sistema`,
        'sistema',
        procedimento
      );
    } else {
      adicionarProcedimento(procedimento);
      showToast('Procedimento adicionado!', 'success');
      adicionarNotificacao(
        'Novo Procedimento',
        `${procedimento.nome} foi adicionado ao sistema`,
        'sistema',
        procedimento
      );
    }
  };

  const handleDeleteProcedimento = (id) => {
    if (confirm('Tem certeza que deseja excluir este procedimento?')) {
      const procedimento = procedimentos.find(p => p.id === id);
      deletarProcedimento(id);
      showToast('Procedimento excluído!', 'success');
      adicionarNotificacao(
        'Procedimento Excluído',
        `${procedimento?.nome} foi removido do sistema`,
        'alerta',
        { id, nome: procedimento?.nome }
      );
    }
  };

  const handleSavePlano = (plano) => {
    const exists = planos.find(p => p.id === plano.id);
    if (exists) {
      atualizarPlano(plano);
      showToast('Plano atualizado!', 'success');
      adicionarNotificacao(
        'Plano Atualizado',
        `${plano.nome} foi atualizado no sistema`,
        'sistema',
        plano
      );
    } else {
      adicionarPlano(plano);
      showToast('Plano adicionado!', 'success');
      adicionarNotificacao(
        'Novo Plano de Saúde',
        `${plano.nome} foi adicionado com ${plano.cobertura}% de cobertura`,
        'sistema',
        plano
      );
    }
  };

  const handleDeletePlano = (id) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      const plano = planos.find(p => p.id === id);
      deletarPlano(id);
      showToast('Plano excluído!', 'success');
      adicionarNotificacao(
        'Plano Excluído',
        `${plano?.nome} foi removido do sistema`,
        'alerta',
        { id, nome: plano?.nome }
      );
    }
  };

  // Renderizar conteúdo baseado na aba ativa
  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <DashboardAnalytics
            agendamentos={agendamentos}
            procedimentos={procedimentos}
            dentistas={dentistas}
            pacientes={pacientes}
          />
        );
      case 'procedimentos':
        return (
          <ProcedimentosManager
            procedimentos={procedimentos}
            onSave={handleSaveProcedimento}
            onDelete={handleDeleteProcedimento}
          />
        );
      case 'planos':
        return (
          <PlanosManager
            planos={planos}
            onSave={handleSavePlano}
            onDelete={handleDeletePlano}
          />
        );
      case 'estoque':
        return (
          <EstoqueManager
            materiais={materiais}
            onSave={(material) => {
              const exists = materiais.find(m => m.id === material.id);
              if (exists) {
                setMateriais(materiais.map(m => m.id === material.id ? material : m));
                adicionarNotificacao(
                  'Material Atualizado',
                  `${material.nome} foi atualizado no estoque`,
                  'sistema',
                  material
                );
              } else {
                setMateriais([...materiais, material]);
                adicionarNotificacao(
                  'Novo Material',
                  `${material.nome} foi adicionado ao estoque`,
                  'sistema',
                  material
                );
              }
            }}
            onDelete={(id) => {
              const material = materiais.find(m => m.id === id);
              setMateriais(materiais.filter(m => m.id !== id));
              adicionarNotificacao(
                'Material Removido',
                `${material?.nome} foi removido do estoque`,
                'alerta',
                { id, nome: material?.nome }
              );
            }}
            onAdicionarEstoque={adicionarEstoque}
          />
        );
      case 'materiais-procedimento':
        return (
          <MateriaisProcedimento
            procedimentos={procedimentos}
            materiais={materiais}
            materiaisPorProcedimento={materiaisPorProcedimento}
            onSave={setMateriaisPorProcedimento}
          />
        );
      case 'distribuicao':
        return (
          <DistribuicaoSala
            salas={['01', '02', '03']}
            materiais={materiais}
            distribuicaoSala={distribuicaoSala}
            onReporMaterial={reporMaterialSala}
          />
        );
      case 'historico-consumo':
        return (
          <HistoricoConsumo
            historicoConsumo={historicoConsumo}
            materiais={materiais}
          />
        );
      case 'pacientes':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users size={24} /> Lista de Pacientes
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Telefone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Convênio</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pacientes.map(paciente => (
                    <tr key={paciente.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{paciente.nome}</td>
                      <td className="px-4 py-3">{paciente.telefone || '-'}</td>
                      <td className="px-4 py-3">{paciente.email || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {paciente.convenio || 'Particular'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setProntuarioView(paciente)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                          title="Ver Prontuário"
                        >
                          <Eye size={14} /> Ver Prontuário
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'relatorios':
        return (
          <RelatoriosAdmin
            agendamentos={agendamentos}
            procedimentos={procedimentos}
            planos={planos}
            pacientes={pacientes}
            materiais={materiais}
            historicoConsumo={historicoConsumo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay para mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Menu Lateral - Altura Total */}
      <aside className={`
        fixed md:relative z-30 bg-gradient-to-b from-gray-900 to-gray-800 text-white
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        h-screen overflow-y-auto flex flex-col
      `}>
        {/* Logo e Toggle */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <Shield size={24} className="text-blue-400" />
              <span className="font-bold text-lg">OdontoFlow</span>
            </div>
          ) : (
            <Shield size={24} className="text-blue-400 mx-auto" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:block text-gray-400 hover:text-white transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Perfil do Usuário */}
        <div className={`p-4 border-b border-gray-700 ${!sidebarOpen && 'text-center'} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold">
                {user?.nome?.charAt(0) || 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.nome}</p>
                <p className="text-xs text-gray-400 truncate">Administrador</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items - Flexível para scroll se necessário */}
        <nav className="flex-1 overflow-y-auto p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-all duration-200
                  ${isActive 
                    ? `bg-${item.color}-600 text-white` 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                  ${!sidebarOpen && 'justify-center'}
                `}
              >
                <Icon size={20} />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {isActive && sidebarOpen && (
                  <div className={`ml-auto w-1.5 h-1.5 bg-white rounded-full`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Botão Sair - Fixado no final do sidebar */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition
              ${!sidebarOpen && 'justify-center'}
            `}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-x-auto min-h-screen">
        {/* Header Superior */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Painel do Administrador</h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Gerencie procedimentos, planos, estoque e relatórios
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden md:block p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Cards de Estatísticas - Só mostra se não estiver na aba de analytics ou pacientes */}
        {activeTab !== 'pacientes' && activeTab !== 'analytics' && (
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-lg shadow p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs">Procedimentos</p>
                    <p className="text-xl font-bold">{stats.totalProcedimentos}</p>
                  </div>
                  <Activity className="text-blue-500" size={24} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs">Planos</p>
                    <p className="text-xl font-bold">{stats.totalPlanos}</p>
                  </div>
                  <CreditCard className="text-green-500" size={24} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs">Pacientes</p>
                    <p className="text-xl font-bold">{stats.totalPacientes}</p>
                  </div>
                  <Users className="text-purple-500" size={24} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs">Agendamentos</p>
                    <p className="text-xl font-bold">{stats.totalAgendamentos}</p>
                  </div>
                  <Calendar className="text-yellow-500" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Dinâmico */}
        <div className="p-4">
          <div className="bg-white rounded-lg shadow">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Modal de Visualização de Prontuário */}
      {prontuarioView && (
        <VisualizarProntuario
          paciente={prontuarioView}
          onClose={() => setProntuarioView(null)}
        />
      )}
    </div>
  );
}
