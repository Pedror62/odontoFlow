import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { MaterialProvider } from './contexts/MaterialContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastContainer } from './components/Toast';
import Login from './components/auth/Login';
import AdminDashboard from './components/dashboard/AdminDashboard';
import DentistaDashboard from './components/dashboard/DentistaDashboard';
import SecretarioDashboard from './components/dashboard/SecretarioDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dentista"
        element={
          <ProtectedRoute allowedRoles={['dentista']}>
            <DentistaDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/secretario"
        element={
          <ProtectedRoute allowedRoles={['secretario']}>
            <SecretarioDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={
        !user ? <Navigate to="/login" /> :
        user.role === 'admin' ? <Navigate to="/admin" /> :
        user.role === 'dentista' ? <Navigate to="/dentista" /> :
        <Navigate to="/secretario" />
      } />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <MaterialProvider>
            <NotificationProvider>
              <AppRoutes />
              <ToastContainer />
            </NotificationProvider>
          </MaterialProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;