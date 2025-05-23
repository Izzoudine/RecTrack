import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import type { ViteDevServer } from 'vite';

dotenv.config();

const app = express();
app.use(express.json());

async function createServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  // Use Vite middlewares
  app.use((req: Request, res: Response, next: NextFunction) => {
    vite.middlewares(req, res, next);
  });

  // Serve index.html for client-side routing (non-API routes)
  app.use('*', (req: Request, res: Response, next: NextFunction) => {
    const filePath = path.resolve(__dirname, '../dist/index.html');
    console.log('Serving index.html for:', req.originalUrl, 'from:', filePath);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        next(err);
      }
    });
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  const port = process.env.PORT || 5173;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
});