import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/socket';

export function createSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    autoConnect: false,
    withCredentials: true,
  });
}
