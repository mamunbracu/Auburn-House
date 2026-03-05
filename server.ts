import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const TABLE_NAME = 'house_data';
const ROW_ID = 'auburn_house_v1';

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Helper to read/write Supabase
const readDB = async () => {
  if (!supabase || !supabaseUrl || !supabaseKey) return null;
  try {
    // Add a 4s timeout to server-side Supabase read
    const supabasePromise = supabase
      .from(TABLE_NAME)
      .select('state')
      .eq('id', ROW_ID)
      .single();
    
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Supabase server timeout')), 4000)
    );

    const result: any = await Promise.race([supabasePromise, timeoutPromise]);
    
    if (result.error) {
      console.error('Supabase read error:', result.error);
      return null;
    }
    return result.data?.state;
  } catch (e) {
    console.warn('Supabase read fallback triggered:', e instanceof Error ? e.message : 'Unknown error');
    return null;
  }
};

const writeDB = async (data: any) => {
  if (!supabase || !supabaseUrl || !supabaseKey) return;
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert({ id: ROW_ID, state: data, updated_at: new Date().toISOString() });
    
    if (error) {
      console.error('Supabase write error:', error);
    }
  } catch (e) {
    console.error('Supabase write catch error:', e);
  }
};

// API Routes
app.get('/api/state', async (req, res) => {
  const data = await readDB();
  res.json(data);
});

app.post('/api/state', async (req, res) => {
  await writeDB(req.body);
  // Broadcast to all clients except sender
  io.emit('state_updated', req.body);
  res.json({ success: true });
});

app.post('/api/clear', async (req, res) => {
  if (supabaseUrl && supabaseKey) {
    await supabase.from(TABLE_NAME).delete().eq('id', ROW_ID);
  }
  io.emit('state_cleared');
  res.json({ success: true });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('update_state', async (newState) => {
    console.log('Received update_state from client:', socket.id);
    await writeDB(newState);
    // Broadcast to all OTHER clients
    socket.broadcast.emit('state_updated', newState);
  });

  socket.on('disconnect', (reason) => {
    console.log(`User disconnected (${socket.id}): ${reason}`);
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
