import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const MOCK_USERS = {
  admin: { id: 1, nome: 'Dr. Carlos Admin', email: 'admin@clinica.com', role: 'admin', senha: 'admin123' },
  dentista: { id: 2, nome: 'Dra. Ana Silva', email: 'dentista@clinica.com', role: 'dentista', senha: 'dent123' },
  secretario: { id: 3, nome: 'Maria Souza', email: 'secretario@clinica.com', role: 'secretario', senha: 'sec123' }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email, senha) => {
    const foundUser = Object.values(MOCK_USERS).find(
      u => u.email === email && u.senha === senha
    );
    
    if (foundUser) {
      const { senha, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, error: 'Usuário ou senha inválidos' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};