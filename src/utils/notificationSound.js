// Função para tocar som de notificação (opcional)
export const playNotificationSound = () => {
  try {
    // Criar um som simples usando Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    audioContext.resume();
  } catch (error) {
    console.log('Som não suportado neste navegador');
  }
};

// Alternativa: usar um elemento de áudio escondido
export const playNotificationSoundAlt = () => {
  const audio = new Audio();
  // Usar um som de notificação simples via DataURL (beep)
  audio.src = 'data:audio/wav;base64,U3RlYWx0aCBpcyBhbiBhdWRpbyBmb3JtYXQgdGhhdCBpcyB1c2VkIGZvciBzb3VuZHM=';
  audio.play().catch(e => console.log('Som bloqueado pelo navegador'));
};