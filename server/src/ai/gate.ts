import { getDb } from '../db/connection.js';
import { sesService } from '../aws/ses.js';

export interface PendingAction {
  id: string;
  action_type: 'send_reminder_email' | 'assign_care_task' | 'update_task_status' | 'create_care_task';
  target_type: string;
  target_id: string;
  proposed_changes: string; // JSON string
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  resolved_at: string | null;
}

export class ApprovalGate {
  public createPendingAction(params: {
    action_type: PendingAction['action_type'];
    target_type: string;
    target_id: string;
    proposed_changes: Record<string, unknown>;
  }): PendingAction {
    const db = getDb();
    const id = `pend-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const changesJson = JSON.stringify(params.proposed_changes);

    db.prepare(`
      INSERT INTO pending_actions (id, action_type, target_type, target_id, proposed_changes, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(id, params.action_type, params.target_type, params.target_id, changesJson);

    return db.prepare('SELECT * FROM pending_actions WHERE id = ?').get(id) as PendingAction;
  }

  public getPendingAction(id: string): PendingAction | null {
    const db = getDb();
    const action = db.prepare('SELECT * FROM pending_actions WHERE id = ?').get(id) as PendingAction | undefined;
    return action || null;
  }

  public async confirmPendingAction(id: string): Promise<{ success: boolean; result: unknown }> {
    const db = getDb();
    const action = this.getPendingAction(id);

    if (!action) {
      throw new Error('Pending action not found');
    }

    if (action.status !== 'pending') {
      throw new Error(`Action has already been ${action.status}`);
    }

    const proposed = JSON.parse(action.proposed_changes);
    let executionResult: unknown = null;

    // Execute according to action type
    switch (action.action_type) {
      case 'send_reminder_email': {
        executionResult = await sesService.sendAppointmentReminder({
          recipientEmail: proposed.recipientEmail,
          recipientName: proposed.recipientName,
          caregiverRole: proposed.caregiverRole,
          appointmentTitle: proposed.appointmentTitle,
          appointmentTime: proposed.appointmentTime,
          appointmentDate: proposed.appointmentDate,
          location: proposed.location,
          message: proposed.message,
          idempotencyToken: action.id,
        });

        // Update linked transport task to Ravi
        if (action.target_id) {
          db.prepare(`
            UPDATE care_tasks 
            SET assigned_to = 'cg-ravi', 
                description = 'Reminder email sent to Ravi Rao. Awaiting ride verification.',
                updated_at = datetime('now')
            WHERE (related_appointment_id = ? OR title LIKE '%transport%') AND status != 'completed'
          `).run(action.target_id);
        }
        break;
      }

      case 'assign_care_task': {
        const taskId = action.target_id;
        const assignedTo = proposed.assigned_to;
        db.prepare("UPDATE care_tasks SET assigned_to = ?, updated_at = datetime('now') WHERE id = ?").run(
          assignedTo,
          taskId
        );

        db.prepare(`
          INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `act-${Date.now()}`,
          'Anika Rao',
          'task_assigned',
          'care_task',
          taskId,
          proposed.taskTitle || 'Care Task',
          `Assigned to ${proposed.assigneeName} via AI approval`,
          'success'
        );

        executionResult = db.prepare('SELECT * FROM care_tasks WHERE id = ?').get(taskId);
        break;
      }

      case 'update_task_status': {
        const taskId = action.target_id;
        const newStatus = proposed.status;
        db.prepare("UPDATE care_tasks SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
          newStatus,
          taskId
        );

        db.prepare(`
          INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `act-${Date.now()}`,
          'Anika Rao',
          newStatus === 'completed' ? 'task_completed' : 'task_status_updated',
          'care_task',
          taskId,
          proposed.taskTitle || 'Care Task',
          `Status updated to ${newStatus} via AI approval`,
          'success'
        );

        executionResult = db.prepare('SELECT * FROM care_tasks WHERE id = ?').get(taskId);
        break;
      }

      default:
        throw new Error(`Unsupported action type: ${action.action_type}`);
    }

    // Mark as confirmed (idempotency locked)
    db.prepare("UPDATE pending_actions SET status = 'confirmed', resolved_at = datetime('now') WHERE id = ?").run(id);

    return { success: true, result: executionResult };
  }

  public cancelPendingAction(id: string): { success: boolean } {
    const db = getDb();
    const action = this.getPendingAction(id);

    if (!action) {
      throw new Error('Pending action not found');
    }

    if (action.status !== 'pending') {
      throw new Error(`Action has already been ${action.status}`);
    }

    db.prepare("UPDATE pending_actions SET status = 'cancelled', resolved_at = datetime('now') WHERE id = ?").run(id);

    // Record cancellation in audit log
    db.prepare(`
      INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `act-cancel-${Date.now()}`,
      'Anika Rao',
      'action_cancelled',
      action.target_type,
      action.target_id,
      `Proposed ${action.action_type}`,
      'User cancelled the proposed operation.',
      'cancelled'
    );

    return { success: true };
  }
}

export const approvalGate = new ApprovalGate();
