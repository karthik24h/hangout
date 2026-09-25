import { createServer } from 'node:http';
import { createApp } from './app';
import { readEnv } from './config/env';
import { pool } from './config/database';
import { attachSocketServer } from './websocket';

const env = readEnv();
const server = createServer(createApp());
const io = attachSocketServer(server, env.frontendOrigins);
server.listen(env.port, () => console.log(`Server running on http://localhost:${env.port}`));
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 10_000);
  timeout.unref();
  io.close(() => {
    void pool.end().then(() => {
      clearTimeout(timeout);
    });
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
