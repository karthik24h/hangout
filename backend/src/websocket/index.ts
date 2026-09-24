import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/socket';

export function attachSocketServer(server: HttpServer, frontendUrl: string) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: { origin: frontendUrl },
    maxHttpBufferSize: 16_384,
  });
  // Public diagnostics only. Do not expose room data until sessions and membership exist.
  io.on('connection', socket => {
    socket.emit('server:ready', { protocolVersion: 1 });
    socket.on('health:ping', reply => {
      if (typeof reply === 'function') reply({ ok: true });
    });
  });
  return io;
}
