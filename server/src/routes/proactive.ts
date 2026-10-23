import { Router, Request, Response } from 'express';
import { proactiveEngine } from '../proactive/engine.js';

export const proactiveRouter = Router();

// GET proactive alerts
proactiveRouter.get('/alerts', (_req: Request, res: Response) => {
  const alerts = proactiveEngine.evaluateCareRisks();
  res.json({
    alerts,
    evaluated_at: new Date().toISOString(),
  });
});

// POST trigger manual evaluation (for testing/demo)
proactiveRouter.post('/check', (_req: Request, res: Response) => {
  const alerts = proactiveEngine.evaluateCareRisks();
  res.json({
    message: 'Proactive care risk evaluation completed.',
    alerts_found: alerts.length,
    alerts,
    evaluated_at: new Date().toISOString(),
  });
});
