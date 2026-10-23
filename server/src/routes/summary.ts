import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

export const summaryRouter = Router();

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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

summaryRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  // Counts
  const totalTasks = (db.prepare('SELECT COUNT(*) as count FROM care_tasks').get() as any).count;
  const openTasks = (db.prepare("SELECT COUNT(*) as count FROM care_tasks WHERE status = 'open' OR status = 'in_progress'").get() as any).count;
  const overdueTasks = (db.prepare("SELECT COUNT(*) as count FROM care_tasks WHERE status = 'overdue' OR (status = 'open' AND due_date < ?)").get(today) as any).count;
  const completedTasks = (db.prepare("SELECT COUNT(*) as count FROM care_tasks WHERE status = 'completed'").get() as any).count;

  // Upcoming appointments (today & future)
  const rawAppointments = db.prepare(`
    SELECT * FROM appointments 
    WHERE date >= ? 
    ORDER BY date ASC
  `).all(today) as any[];

  rawAppointments.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return toMinutes(a.time) - toMinutes(b.time);
  });
  const upcomingAppointments = rawAppointments.slice(0, 5);

  // Priority tasks
  const priorityTasks = db.prepare(`
    SELECT 
      t.*,
      c.name AS assignee_name,
      c.avatar_initials AS assignee_initials,
      c.avatar_color AS assignee_color
    FROM care_tasks t
    LEFT JOIN caregivers c ON t.assigned_to = c.id
    WHERE t.status != 'completed'
    ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, t.due_date ASC
    LIMIT 6
  `).all();

  // Recent activity
  const recentActivity = db.prepare(`
    SELECT * FROM activity_events 
    ORDER BY timestamp DESC 
    LIMIT 5
  `).all();

  // Check if an SES reminder has already been sent today
  const reminderSent = !!(db.prepare(`
    SELECT id FROM activity_events 
    WHERE (action = 'ses_reminder_simulated' OR action = 'ses_reminder_sent')
    LIMIT 1
  `).get());

  res.json({
    greeting: getGreeting(),
    date: formatDate(),
    total_tasks: totalTasks,
    open_tasks: openTasks,
    overdue_tasks: overdueTasks,
    completed_tasks: completedTasks,
    upcoming_appointments: upcomingAppointments,
    priority_tasks: priorityTasks,
    recent_activity: recentActivity,
    transport_reminder_sent: reminderSent,
  });
});
