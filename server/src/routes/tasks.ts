import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection.js';

export const tasksRouter = Router();

const taskCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'overdue']).default('open'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  assigned_to: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  due_time: z.string().nullable().optional(),
  related_appointment_id: z.string().nullable().optional(),
});

const taskStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'completed', 'overdue']),
});

const taskAssignSchema = z.object({
  assigned_to: z.string().nullable(),
});

// GET all tasks (with optional filter by status, assigned_to)
tasksRouter.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { status, assigned_to } = req.query;

  let query = `
    SELECT 
      t.*,
      c.name AS assignee_name,
      c.avatar_initials AS assignee_initials,
      c.avatar_color AS assignee_color
    FROM care_tasks t
    LEFT JOIN caregivers c ON t.assigned_to = c.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (status && typeof status === 'string') {
    query += ' AND t.status = ?';
    params.push(status);
  }

  if (assigned_to && typeof assigned_to === 'string') {
    if (assigned_to === 'unassigned') {
      query += ' AND t.assigned_to IS NULL';
    } else {
      query += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }
  }

  query += " ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, t.due_date ASC, t.due_time ASC";

  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

// GET single task
tasksRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const task = db.prepare(`
    SELECT 
      t.*,
      c.name AS assignee_name,
      c.avatar_initials AS assignee_initials,
      c.avatar_color AS assignee_color
    FROM care_tasks t
    LEFT JOIN caregivers c ON t.assigned_to = c.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  res.json(task);
});

// POST new task
tasksRouter.post('/', (req: Request, res: Response) => {
  const parsed = taskCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues });
    return;
  }

  const db = getDb();
  const id = `task-${Date.now()}`;
  const data = parsed.data;

  db.prepare(`
    INSERT INTO care_tasks (id, title, description, status, priority, assigned_to, due_date, due_time, related_appointment_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.title,
    data.description || null,
    data.status,
    data.priority,
    data.assigned_to || null,
    data.due_date || null,
    data.due_time || null,
    data.related_appointment_id || null
  );

  // Log audit
  db.prepare(`
    INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `act-${Date.now()}`,
    'Anika Rao',
    'task_created',
    'care_task',
    id,
    data.title,
    `Priority: ${data.priority}, Due: ${data.due_date || 'None'}`,
    'success'
  );

  const created = db.prepare(`
    SELECT 
      t.*,
      c.name AS assignee_name,
      c.avatar_initials AS assignee_initials,
      c.avatar_color AS assignee_color
    FROM care_tasks t
    LEFT JOIN caregivers c ON t.assigned_to = c.id
    WHERE t.id = ?
  `).get(id);

  res.status(201).json(created);
});

// PATCH task status
tasksRouter.patch('/:id/status', (req: Request, res: Response) => {
  const parsed = taskStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid status', errors: parsed.error.issues });
    return;
  }

  const db = getDb();
  const task = db.prepare('SELECT * FROM care_tasks WHERE id = ?').get(req.params.id) as any;
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  const newStatus = parsed.data.status;
  db.prepare(`
    UPDATE care_tasks
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newStatus, req.params.id);

  // Record audit event
  const actionName = newStatus === 'completed' ? 'task_completed' : 'task_status_updated';
  db.prepare(`
    INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `act-${Date.now()}`,
    'Anika Rao',
    actionName,
    'care_task',
    req.params.id,
    task.title,
    `Status changed from ${task.status} to ${newStatus}`,
    'success'
  );

  const updated = db.prepare(`
    SELECT 
      t.*,
      c.name AS assignee_name,
      c.avatar_initials AS assignee_initials,
      c.avatar_color AS assignee_color
    FROM care_tasks t
    LEFT JOIN caregivers c ON t.assigned_to = c.id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// PATCH assign task
tasksRouter.patch('/:id/assign', (req: Request, res: Response) => {
  const parsed = taskAssignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid assignee', errors: parsed.error.issues });
    return;
  }

  const db = getDb();
  const task = db.prepare('SELECT * FROM care_tasks WHERE id = ?').get(req.params.id) as any;
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  const assignedTo = parsed.data.assigned_to;
  let caregiverName = 'Unassigned';
  if (assignedTo) {
    const cg = db.prepare('SELECT name FROM caregivers WHERE id = ?').get(assignedTo) as any;
    if (cg) caregiverName = cg.name;
  }

  db.prepare(`
    UPDATE care_tasks
    SET assigned_to = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(assignedTo, req.params.id);

  // Record audit
  db.prepare(`
    INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `act-${Date.now()}`,
    'Anika Rao',
    'task_assigned',
    'care_task',
    req.params.id,
    task.title,
    `Assigned to ${caregiverName}`,
    'success'
  );

  const updated = db.prepare(`
    SELECT 
      t.*,
      c.name AS assignee_name,
      c.avatar_initials AS assignee_initials,
      c.avatar_color AS assignee_color
    FROM care_tasks t
    LEFT JOIN caregivers c ON t.assigned_to = c.id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json(updated);
});
