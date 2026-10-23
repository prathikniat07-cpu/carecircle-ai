import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection.js';

export const activityRouter = Router();

const activityCreateSchema = z.object({
  actor: z.string().default('Anika Rao'),
  action: z.string().min(1),
  target_type: z.string().min(1),
  target_id: z.string().min(1),
  target_label: z.string().min(1),
  details: z.string().nullable().optional(),
  result: z.enum(['success', 'failed', 'cancelled', 'pending']).default('success'),
});

// GET recent activity events
activityRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const limit = parseInt((req.query.limit as string) || '50', 10);
  const events = db.prepare('SELECT * FROM activity_events ORDER BY timestamp DESC LIMIT ?').all(limit);
  res.json(events);
});

// POST new activity event
activityRouter.post('/', (req: Request, res: Response) => {
  const parsed = activityCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues });
    return;
  }

  const db = getDb();
  const id = `act-${Date.now()}`;
  const data = parsed.data;

  db.prepare(`
    INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.actor,
    data.action,
    data.target_type,
    data.target_id,
    data.target_label,
    data.details || null,
    data.result
  );

  const created = db.prepare('SELECT * FROM activity_events WHERE id = ?').get(id);
  res.status(201).json(created);
});
