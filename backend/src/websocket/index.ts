import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/socket';
import { validateSession, revokeSession } from '../utils/sessions';
import { pool } from '../config/database';

let cookieModule: { parse: (str: string) => Record<string, string> } | null = null;

async function getCookieModule(): Promise<{ parse: (str: string) => Record<string, string> }> {
  if (!cookieModule) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('cookie');
    cookieModule = { parse: mod.parse };
  }
  return cookieModule!;
}

interface AuthenticatedSocket {
  userId: number;
  userName: string;
  userEmail: string;
  sessionToken: string;
}

declare module 'socket.io' {
  interface Socket {
    authUser?: AuthenticatedSocket;
  }
}

export function attachSocketServer(server: HttpServer, frontendUrl: string) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: { origin: frontendUrl },
    maxHttpBufferSize: 16_384,
  });

  // Session validation middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      // Get cookie from handshake headers
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(); // Allow connection but mark as unauthenticated
      }

      // Parse cookies (dynamic import for ESM module)
      const cookie = await getCookieModule();
      const parsedCookies = cookie.parse(cookies);
      const sessionToken = parsedCookies.hangout_session;

      if (!sessionToken) {
        return next(); // Allow connection but mark as unauthenticated
      }

      // Validate session
      const session = await validateSession(sessionToken);
      if (!session) {
        return next(); // Allow connection but mark as unauthenticated
      }

      // Get user info
      const userResult = await pool.query(`SELECT id, name, email FROM users WHERE id = $1`, [
        session.userId,
      ]);

      if (userResult.rows.length === 0) {
        return next(); // Allow connection but mark as unauthenticated
      }

      const user = userResult.rows[0];
      socket.authUser = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        sessionToken,
      };

      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(); // Allow connection but mark as unauthenticated
    }
  });

  // Public diagnostics only. Do not expose room data until sessions and membership exist.
  io.on('connection', socket => {
    socket.emit('server:ready', { protocolVersion: 1 });

    socket.on('health:ping', reply => {
      if (typeof reply === 'function') reply({ ok: true });
    });

    // Handle session validation request
    socket.on('auth:validate', reply => {
      if (typeof reply === 'function') {
        if (socket.authUser) {
          reply({
            ok: true,
            user: {
              id: socket.authUser.userId,
              name: socket.authUser.userName,
              email: socket.authUser.userEmail,
            },
          });
        } else {
          reply({ ok: false, error: 'Not authenticated' });
        }
      }
    });

    // Handle logout from socket
    socket.on('auth:logout', async reply => {
      if (typeof reply === 'function') {
        if (socket.authUser?.sessionToken) {
          await revokeSession(socket.authUser.sessionToken);
          socket.authUser = undefined;
        }
        reply({ ok: true });
      }
    });
  });

  return io;
}

// Helper to get authenticated user from socket
export function getSocketUser(socket: {
  authUser?: AuthenticatedSocket;
}): AuthenticatedSocket | null {
  return socket.authUser || null;
}

// Helper to require authentication in socket handlers
export function requireSocketAuth(socket: { authUser?: AuthenticatedSocket }): AuthenticatedSocket {
  if (!socket.authUser) {
    throw new Error('Authentication required');
  }
  return socket.authUser;
}
