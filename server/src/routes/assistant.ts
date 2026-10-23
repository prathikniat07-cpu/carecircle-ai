import { Router, Request, Response } from 'express';
import { orchestrator } from '../ai/orchestrator.js';
import { approvalGate } from '../ai/gate.js';

export const assistantRouter = Router();

// Chat endpoint
assistantRouter.post('/chat', async (req: Request, res: Response) => {
  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    res.status(400).json({ message: 'A message string is required' });
    return;
  }

  try {
    const result = await orchestrator.handleUserMessage(message);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error executing assistant request' });
  }
});

// View pending action
assistantRouter.get('/pending/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const pending = approvalGate.getPendingAction(id);
  if (!pending) {
    res.status(404).json({ message: 'Pending action not found' });
    return;
  }
  res.json(pending);
});

// Confirm pending action (User approval gate)
assistantRouter.post('/confirm/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await approvalGate.confirmPendingAction(id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to confirm action' });
  }
});

// Cancel pending action
assistantRouter.post('/cancel/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = approvalGate.cancelPendingAction(id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to cancel action' });
  }
});
