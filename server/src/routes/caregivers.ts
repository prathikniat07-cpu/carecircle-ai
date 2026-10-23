import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

export const caregiversRouter = Router();

caregiversRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const caregivers = db.prepare('SELECT * FROM caregivers ORDER BY name ASC').all();
  res.json(caregivers);
});

caregiversRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const caregiver = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(req.params.id);
  if (!caregiver) {
    res.status(404).json({ message: 'Caregiver not found' });
    return;
  }
  res.json(caregiver);
});
