import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { createTasksRouter } from './routes/tasks.js';
import { createPrdRouter } from './routes/prd.js';
import { createAnalysisRouter } from './routes/analysis.js';
import { initDatabase } from './services/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function startServer(port: number): Promise<Server> {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Create HTTP server
  const server = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  // Broadcast function for real-time updates
  function broadcast(type: string, payload: unknown): void {
    const message = JSON.stringify({ type, payload });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  // Initialize database
  await initDatabase();

  // API Routes
  app.use('/api/tasks', createTasksRouter(broadcast));
  app.use('/api/prd', createPrdRouter());
  app.use('/api/analysis', createAnalysisRouter(broadcast));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Serve static files from /public/ directory
  const publicDir = join(__dirname, '..', 'public');

  if (existsSync(publicDir)) {
    app.use(express.static(publicDir));

    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      // Don't handle API routes
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.sendFile(join(publicDir, 'index.html'));
    });
  }

  return new Promise((resolve) => {
    server.listen(port, () => {
      resolve(server);
    });
  });
}
