import { useEffect, useState } from 'react';
import { createSocket } from '../socket/client';

export function useConnectionStatus() {
  const [status, setStatus] = useState('Connecting');
  useEffect(() => {
    const socket = createSocket();
    socket.on('connect', () => setStatus('Connected'));
    socket.on('disconnect', () => setStatus('Disconnected'));
    socket.on('connect_error', () => setStatus('Offline — retrying'));
    socket.connect();
    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, []);
  return status;
}
