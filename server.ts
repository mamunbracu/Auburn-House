import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Helper to read/write DB
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return null;
  }
};

const writeDB = (data: any) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// API Routes
app.get('/api/state', (req, res) => {
  const data = readDB();
  res.json(data);
});

app.post('/api/state', (req, res) => {
  writeDB(req.body);
  // Broadcast to all clients except sender
  io.emit('state_updated', req.body);
  res.json({ success: true });
});

app.post('/api/clear', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
  }
  io.emit('state_cleared');
  res.json({ success: true });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('update_state', (newState) => {
    writeDB(newState);
    socket.broadcast.emit('state_updated', newState);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist/index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
