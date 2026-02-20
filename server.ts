import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Helper to read/write DB
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
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
  res.json({ success: true });
});

app.post('/api/clear', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
  }
  res.json({ success: true });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
