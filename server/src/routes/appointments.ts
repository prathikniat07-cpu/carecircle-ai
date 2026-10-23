import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection.js';

export const appointmentsRouter = Router();

const appointmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().min(1, 'Time is required'),
  duration_minutes: z.number().int().positive().default(30),
  location: z.string().nullable().optional(),
  transport_status: z.enum(['confirmed', 'pending', 'not_needed']).default('pending'),
  followup_status: z.enum(['completed', 'pending', 'not_needed']).default('pending'),
  notes: z.string().nullable().optional(),
});

function toMinutes(timeStr: string): number {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// GET all appointments
appointmentsRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const appointments = db.prepare('SELECT * FROM appointments ORDER BY date ASC').all() as any[];
  appointments.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return toMinutes(a.time) - toMinutes(b.time);
  });
  res.json(appointments);
});

// GET single appointment
appointmentsRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appointment) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }
  res.json(appointment);
});

// POST new appointment
appointmentsRouter.post('/', (req: Request, res: Response) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues });
    return;
  }

  const db = getDb();
  const id = `apt-${Date.now()}`;
  const data = parsed.data;

  db.prepare(`
    INSERT INTO appointments (id, title, date, time, duration_minutes, location, transport_status, followup_status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.title,
    data.date,
    data.time,
    data.duration_minutes,
    data.location || null,
    data.transport_status,
    data.followup_status,
    data.notes || null
  );

  // Record audit log
  db.prepare(`
    INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `act-${Date.now()}`,
    'Anika Rao',
    'appointment_created',
    'appointment',
    id,
    data.title,
    `Scheduled on ${data.date} at ${data.time}`,
    'success'
  );

  const created = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  res.status(201).json(created);
});

// PATCH appointment details
appointmentsRouter.patch('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as any;
  if (!existing) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }

  const { transport_status, followup_status, notes, location } = req.body;
  const newTransport = transport_status ?? existing.transport_status;
  const newFollowup = followup_status ?? existing.followup_status;
  const newNotes = notes !== undefined ? notes : existing.notes;
  const newLocation = location !== undefined ? location : existing.location;

  db.prepare(`
    UPDATE appointments
    SET transport_status = ?, followup_status = ?, notes = ?, location = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newTransport, newFollowup, newNotes, newLocation, req.params.id);

  // Record audit
  db.prepare(`
    INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `act-${Date.now()}`,
    'Anika Rao',
    'appointment_updated',
    'appointment',
    req.params.id,
    existing.title,
    `Updated coordination details: transport=${newTransport}, follow-up=${newFollowup}`,
    'success'
  );

  const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  res.json(updated);
});
