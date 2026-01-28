import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { createTasksRouter } from './routes/tasks.js';
import { createPrdRouter } from './routes/prd.js';
import { createAnalysisRouter } from './routes/analysis.js';
import { initDatabase } from './services/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

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
  console.log('Client connected. Total clients:', clients.size);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
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

// Routes
app.use('/api/tasks', createTasksRouter(broadcast));
app.use('/api/prd', createPrdRouter());
app.use('/api/analysis', createAnalysisRouter(broadcast));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start server
async function start() {
  await initDatabase();
  console.log('Database initialized');

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
  });
}

start().catch(console.error);
