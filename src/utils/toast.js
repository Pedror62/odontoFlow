// Sistema de notificação alternativo sem dependências externas
let toastId = 0;
const toasts = new Map();

export const showToast = (message, type = 'success') => {
  const id = toastId++;
  const toast = { id, message, type };
  
  // Disparar evento personalizado
  window.dispatchEvent(new CustomEvent('show-toast', { detail: toast }));
  
  // Auto-remover após 3 segundos
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('remove-toast', { detail: { id } }));
  }, 3000);
  
  return id;
};

export const ToastContainer = () => {
  const [toastList, setToastList] = React.useState([]);
  
  React.useEffect(() => {
    const handleShow = (e) => {
      setToastList(prev => [...prev, e.detail]);
    };
    
    const handleRemove = (e) => {
      setToastList(prev => prev.filter(t => t.id !== e.detail.id));
    };
    
    window.addEventListener('show-toast', handleShow);
    window.addEventListener('remove-toast', handleRemove);
    
    return () => {
      window.removeEventListener('show-toast', handleShow);
      window.removeEventListener('remove-toast', handleRemove);
    };
  }, []);
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastList.map(toast => (
        <div
          key={toast.id}
          className={`px-6 py-3 rounded-lg shadow-lg text-white animate-in slide-in-from-top-2 ${
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