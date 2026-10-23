import type Database from 'better-sqlite3';
import { getDb, initializeDatabase } from './connection.js';

function runSeed(db: Database.Database, clearExisting = false): void {
  // Wrap in transaction for atomicity
  const seed = db.transaction(() => {
    if (clearExisting) {
      // Clear existing data (idempotent seed/reset)
      db.prepare('DELETE FROM pending_actions').run();
      db.prepare('DELETE FROM activity_events').run();
      db.prepare('DELETE FROM care_tasks').run();
      db.prepare('DELETE FROM appointments').run();
      db.prepare('DELETE FROM caregivers').run();
    }

    // 1. Caregivers
    const insertCaregiver = db.prepare(`
      INSERT INTO caregivers (id, name, role, avatar_initials, avatar_color)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertCaregiver.run('cg-anika', 'Anika Rao', 'Primary Caregiver (Daughter)', 'AR', '#23483D');
    insertCaregiver.run('cg-ravi', 'Ravi Rao', 'Caregiver (Son)', 'RR', '#2D5A4C');

    // 2. Appointments (Current date dynamically formatted to YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const insertAppointment = db.prepare(`
      INSERT INTO appointments (id, title, date, time, duration_minutes, location, transport_status, followup_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAppointment.run(
      'apt-1',
      'Routine clinic appointment',
      today,
      '11:00 AM',
      45,
      'Oak Valley Health Clinic — Suite 210',
      'pending',
      'pending',
      'Annual wellness & cardiology checkup with Dr. Henderson. Bring recent vitals log.'
    );

    insertAppointment.run(
      'apt-2',
      'Cardiology follow-up call',
      today,
      '04:00 PM',
      30,
      'Telehealth / Dr. Patel',
      'not_needed',
      'pending',
      'Review holter monitor report and discuss beta-blocker dosage adjustments.'
    );

    insertAppointment.run(
      'apt-3',
      'Physical therapy session',
      tomorrow,
      '10:30 AM',
      60,
      'ActiveLife Wellness Center',
      'confirmed',
      'pending',
      'Mobility and balance rehabilitation exercises.'
    );

    // 3. Care Tasks
    const insertTask = db.prepare(`
      INSERT INTO care_tasks (id, title, description, status, priority, assigned_to, due_date, due_time, related_appointment_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Task 1: Transport follow-up (unassigned, open — ideal for AI assign demo)
    insertTask.run(
      'task-1',
      'Confirm transport for 11:00 AM clinic visit',
      'Arrange wheelchair-accessible ride or confirm family driver for Meera to Oak Valley Health Clinic.',
      'open',
      'high',
      null, // unassigned
      today,
      '09:30 AM',
      'apt-1'
    );

    // Task 2: Prepare appointment documents (open, unassigned — ideal for AI mark prepared demo)
    insertTask.run(
      'task-2',
      'Prepare appointment documents',
      'Print recent medication list, insurance card, and blood pressure logs for clinic checkup.',
      'open',
      'high',
      'cg-anika',
      today,
      '10:00 AM',
      'apt-1'
    );

    // Task 3: Pharmacy pickup
    insertTask.run(
      'task-3',
      'Pick up prescription refill from CVS',
      'Collect Lisinopril and Metoprolol monthly refill at Main St pharmacy.',
      'open',
      'medium',
      'cg-ravi',
      today,
      '02:00 PM',
      null
    );

    // Task 4: Post-visit checklist
    insertTask.run(
      'task-4',
      'Complete post-visit checklist & doctor notes',
      'Record physician recommendations, schedule next follow-up, and update family shared log.',
      'open',
      'medium',
      'cg-anika',
      today,
      '05:00 PM',
      'apt-1'
    );

    // Task 5: Morning medication (already completed earlier)
    insertTask.run(
      'task-5',
      'Morning medication & vitals check',
      'Administer morning medications with breakfast; measure blood pressure and heart rate.',
      'completed',
      'high',
      'cg-anika',
      today,
      '08:00 AM',
      null
    );

    // 4. Activity Events (Initial audit trail)
    const insertActivity = db.prepare(`
      INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const morningIso = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    const systemNoticeIso = new Date(Date.now() - 2 * 3600 * 1000).toISOString();

    insertActivity.run(
      'act-1',
      'Anika Rao',
      'task_completed',
      'care_task',
      'task-5',
      'Morning medication & vitals check',
      'BP logged at 122/78 mmHg. Morning doses administered with oatmeal.',
      'success',
      morningIso
    );

    insertActivity.run(
      'act-2',
      'CareCircle System',
      'appointment_alert',
      'appointment',
      'apt-1',
      'Routine clinic appointment (11:00 AM)',
      'Automated reminder: Transport status is still pending confirmation.',
      'success',
      systemNoticeIso
    );
  });

  seed();
}

export function seedDatabase(): void {
  initializeDatabase();
  const db = getDb();
  console.log('[CareCircle DB] Starting manual database seed (with reset)...');
  runSeed(db, true);
  console.log('[CareCircle DB] Database reset and seeded successfully with demo data!');
}

export function seedDatabaseIfEmpty(): boolean {
  initializeDatabase();
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM caregivers').get() as { count: number } | undefined;
  if (row && row.count > 0) {
    console.log(`[CareCircle DB] Database already contains ${row.count} caregivers. Preserving existing data across restarts.`);
    return false;
  }
  console.log('[CareCircle DB] Empty database detected on startup. Seeding initial baseline data...');
  runSeed(db, false);
  console.log('[CareCircle DB] Initial baseline data seeded successfully!');
  return true;
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
  process.exit(0);
}
