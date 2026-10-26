import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/routes.js';
import { getDb } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize SQLite database
  await getDb();
  console.log('SQLite Database initialized successfully.');

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount API router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Smart Queue Management System API' });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  function startListening(portToUse: number) {
    const srv = app.listen(portToUse, '0.0.0.0', () => {
      console.log(`Smart Queue Management System running at http://localhost:${portToUse}`);
    });

    srv.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE' && !process.env.PORT && portToUse < 3010) {
        console.warn(`Port ${portToUse} is already in use. Retrying on port ${portToUse + 1}...`);
        startListening(portToUse + 1);
      } else {
        console.error('Server listen error:', err);
        process.exit(1);
      }
    });
  }

  startListening(PORT);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
