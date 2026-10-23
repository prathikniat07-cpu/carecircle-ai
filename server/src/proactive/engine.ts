import { getDb } from '../db/connection.js';
import { approvalGate } from '../ai/gate.js';

export interface ProactiveAlert {
  alert_id: string;
  severity: 'high' | 'medium' | 'info';
  appointment_id: string;
  appointment_title: string;
  appointment_time: string;
  appointment_date: string;
  unresolved_item: string;
  message: string;
  proposed_action_id: string;
  proposed_recipient: string;
  created_at: string;
}

export class ProactiveEngine {
  public evaluateCareRisks(): ProactiveAlert[] {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const alerts: ProactiveAlert[] = [];

    // 1. Find appointments with unconfirmed transport
    const pendingAppointments = db.prepare(`
      SELECT * FROM appointments 
      WHERE transport_status = 'pending' AND date >= ?
      ORDER BY date ASC, time ASC
    `).all(today) as any[];

    for (const apt of pendingAppointments) {
      // Find linked or related transport task
      const transportTask = db.prepare(`
        SELECT * FROM care_tasks 
        WHERE (related_appointment_id = ? OR title LIKE '%transport%') AND status != 'completed'
      `).get(apt.id) as any;

      const caregiver = db.prepare("SELECT * FROM caregivers WHERE id = 'cg-ravi'").get() as any || {
        name: 'Ravi Rao',
        role: 'Caregiver (Son)',
      };

      // Check if we already created an active pending action for this appointment
      const existingPending = db.prepare(`
        SELECT * FROM pending_actions 
        WHERE target_id = ? AND status = 'pending'
      `).get(apt.id) as any;

      let pendingActionId: string;

      if (existingPending) {
        pendingActionId = existingPending.id;
      } else {
        // Create deduplicated pending action proposal
        const pending = approvalGate.createPendingAction({
          action_type: 'send_reminder_email',
          target_type: 'appointment',
          target_id: apt.id,
          proposed_changes: {
            recipientEmail: 'ravi.rao@example.com',
            recipientName: caregiver.name || 'Ravi Rao',
            caregiverRole: caregiver.role || 'Caregiver (Son)',
            appointmentTitle: apt.title,
            appointmentTime: apt.time,
            appointmentDate: apt.date,
            location: apt.location,
            message: `Meera's ${apt.title} is at ${apt.time}. Transport is currently unconfirmed. Please verify ride arrangements or let Anika know.`,
            explanation: `Meera's ${apt.title} is approaching at ${apt.time}, but transport is still unconfirmed. Propose sending an email reminder to ${caregiver.name}.`,
          },
        });
        pendingActionId = pending.id;
      }

      alerts.push({
        alert_id: `alert-${apt.id}`,
        severity: 'high',
        appointment_id: apt.id,
        appointment_title: apt.title,
        appointment_time: apt.time,
        appointment_date: apt.date,
        unresolved_item: transportTask ? transportTask.title : 'Unconfirmed ride arrangements',
        message: `Meera's ${apt.title} is approaching at ${apt.time}, but transport is still unconfirmed. Would you like me to remind Ravi?`,
        proposed_action_id: pendingActionId,
        proposed_recipient: 'Ravi Rao (ravi.rao@example.com)',
        created_at: new Date().toISOString(),
      });
    }

    return alerts;
  }
}

export const proactiveEngine = new ProactiveEngine();
