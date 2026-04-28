import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, X, Check, AlertTriangle, Calendar, Package, 
  Trash2, CheckCheck, Clock, MapPin, Stethoscope,
  ShoppingCart, Users, TrendingUp
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

export default function NotificationCenter() {
  const { 
    notifications, 
    notificacoesNaoLidas,
    marcarComoLida,
    marcarTodasComoLidas,
    removerNotificacao
  } = useNotification();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('todas');
  const dropdownRef = useRef(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIconByTipo = (tipo) => {
    switch (tipo) {
      case 'estoque':
        return <Package size={16} className="text-yellow-500" />;
      case 'retorno':
        return <Calendar size={16} className="text-blue-500" />;
      case 'alerta':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'paciente':
        return <Users size={16} className="text-green-500" />;
      case 'financeiro':
        return <TrendingUp size={16} className="text-purple-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getTempoRelativo = (data) => {
    const agora = new Date();
    const notificacaoData = new Date(data);
    const diffMinutos = Math.floor((agora - notificacaoData) / (1000 * 60));
    
    if (diffMinutos < 1) return 'Agora mesmo';
    if (diffMinutos < 60) return `${diffMinutos} min atrás`;
    if (diffMinutos < 1440) return `${Math.floor(diffMinutos / 60)}h atrás`;
    if (diffMinutos < 2880) return 'Ontem';
    return `${Math.floor(diffMinutos / 1440)}d atrás`;
  };

  const notificationsFiltradas = notifications.filter(n => {
    if (activeTab === 'nao_lidas') return !n.lida;
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Bell size={22} />
        {notificacoesNaoLidas > 0 && (
          <>
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
            </span>
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
          </>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-50 to-white">
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Bell size={18} className="text-blue-600" />
                Notificações
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {notificacoesNaoLidas} não lidas
              </p>
            </div>
            <div className="flex gap-2">
              {notificacoesNaoLidas > 0 && (
                <button
                  onClick={marcarTodasComoLidas}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded transition"
                >
                  <CheckCheck size={14} /> Marcar todas
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab('todas')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                activeTab === 'todas'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('nao_lidas')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                activeTab === 'nao_lidas'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                Não lidas
                {notificacoesNaoLidas > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px]">
                    {notificacoesNaoLidas}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* Lista de notificações */}
          <div className="max-h-96 overflow-y-auto">
            {notificationsFiltradas.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-400 font-medium">Nenhuma notificação</p>
                <p className="text-xs text-gray-300 mt-1">As notificações aparecerão aqui</p>
              </div>
            ) : (
              notificationsFiltradas.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 border-b hover:bg-gray-50 transition cursor-pointer ${
                    !notif.lida ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => marcarComoLida(notif.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        notif.tipo === 'estoque' ? 'bg-yellow-100' :
                        notif.tipo === 'retorno' ? 'bg-blue-100' :
                        notif.tipo === 'alerta' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {getIconByTipo(notif.tipo)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className={`font-medium text-sm ${!notif.lida ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notif.titulo}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removerNotificacao(notif.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition p-1"
                          title="Remover notificação"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notif.mensagem}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {getTempoRelativo(notif.data)}
                        </p>
                        {!notif.lida && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            Nova
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t bg-gray-50 text-center">
              <button
                onClick={() => {
                  marcarTodasComoLidas();
                  setIsOpen(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}