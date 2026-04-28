import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../Toast';
import { Activity, Stethoscope, Calendar, Users } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const { login } = useAuth();
  const { adicionarNotificacao } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(email, senha);
    
    if (result.success) {
      // Toast de boas-vindas
      showToast(`Bem-vindo, ${result.user.nome}!`, 'success');
      
      // Notificação no sino
      const roleText = result.user.role === 'admin' ? 'Administrador' : 
                       result.user.role === 'dentista' ? 'Dentista' : 'Secretário';
      adicionarNotificacao(
        
        `Você está logado como ${roleText}`,
        'bemvindo',
        { nome: result.user.nome, role: result.user.role }
      );
      
      // Redirecionar
      if (result.user.role === 'admin') navigate('/admin');
      else if (result.user.role === 'dentista') navigate('/dentista');
      else if (result.user.role === 'secretario') navigate('/secretario');
    } else {
      showToast(result.error, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <div className="flex justify-center mb-4">
            <Stethoscope size={48} />
          </div>
          <h2 className="text-2xl font-bold">Sistema Odontológico</h2>
          <p className="text-blue-100 mt-2">Login para acessar o sistema</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="email@clinica.com"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="••••••"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Entrar
          </button>
        </form>
        
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-600">
          <p className="font-semibold mb-1">Credenciais de teste:</p>
          <p>👑 Admin: admin@clinica.com / admin123</p>
          <p>🦷 Dentista: dentista@clinica.com / dent123</p>
          <p>📋 Secretário: secretario@clinica.com / sec123</p>
        </div>
      </div>
    </div>
  );
}