import { Router } from 'express';
import { getDb } from '../db/connection.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  try {
    const db = getDb();
    // Simple query to verify DB is working
    const result = db.prepare('SELECT 1 as ok').get() as { ok: number };

    res.json({
      status: 'healthy',
      database: result?.ok === 1 ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      mode: process.env.GEMINI_API_KEY ? 'live' : 'demo',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});
