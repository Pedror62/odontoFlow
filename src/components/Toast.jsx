import React, { useState, useEffect } from 'react';

let toastId = 0;
const listeners = new Set();

export const showToast = (message, type = 'success') => {
  const id = toastId++;
  const toast = { id, message, type };
  
  listeners.forEach(listener => listener(toast));
  
  setTimeout(() => {
    listeners.forEach(listener => listener({ id, remove: true }));
  }, 3000);
  
  return id;
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (toast) => {
      if (toast.remove) {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      } else {
        setToasts(prev => [...prev, toast]);
      }
    };
    
    listeners.add(handleToast);
    return () => listeners.delete(handleToast);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-6 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};