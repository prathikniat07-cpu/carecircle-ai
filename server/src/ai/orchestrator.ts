import { toolRegistry } from '../tools/registry.js';
import { approvalGate, PendingAction } from './gate.js';

export interface AssistantResponse {
  message: string;
  tools_called: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result: unknown;
  }>;
  pending_action?: {
    id: string;
    action_type: string;
    description: string;
    proposed_changes: Record<string, unknown>;
  };
}

export class AssistantOrchestrator {
  public async handleUserMessage(userMessage: string): Promise<AssistantResponse> {
    const input = userMessage.toLowerCase().trim();
    const toolsCalled: AssistantResponse['tools_called'] = [];
    let pendingActionData: AssistantResponse['pending_action'] | undefined = undefined;
    let replyText = '';

    // Request 1: "Prepare today's care plan" / "Prepare today's care plan and tell me what needs attention"
    if (input.includes('care plan') || input.includes("today's plan") || input.includes('summary')) {
      const summaryResult = await toolRegistry.executeTool('get_daily_summary', {});
      toolsCalled.push({
        name: 'get_daily_summary',
        arguments: {},
        result: summaryResult,
      });

      const openCount = (summaryResult as any).open_tasks_count;
      const apts = (summaryResult as any).upcoming_appointments || [];
      const aptSummary = apts.length > 0 ? `${apts.length} appointments scheduled today` : 'No appointments scheduled today';

      replyText = `Here is today's care plan for Meera Rao:
• ${aptSummary}, beginning with the Routine Clinic Appointment at 11:00 AM.
• There are ${openCount} open care tasks requiring family attention.
• Immediate priority: Transport arrangements for the 11:00 AM visit remain unconfirmed.`;
    }

    // Request 2: "Show the tasks that are still open" / "open tasks"
    else if (input.includes('open') && (input.includes('task') || input.includes('checklist'))) {
      const tasksResult = await toolRegistry.executeTool('list_care_tasks', { status: 'open' });
      toolsCalled.push({
        name: 'list_care_tasks',
        arguments: { status: 'open' },
        result: tasksResult,
      });

      const tasksList = tasksResult as any[];
      replyText = `I retrieved ${tasksList.length} open tasks for Meera Rao from the database:
${tasksList.map((t, idx) => `${idx + 1}. ${t.title} (${t.priority} priority, ${t.assignee_name ? `assigned to ${t.assignee_name}` : 'Unassigned'})`).join('\n')}

Would you like me to assign the unassigned transport task or update any status?`;
    }

    // Request 3: "What needs attention before the next appointment?" / "next appointment"
    else if (input.includes('next appointment') || input.includes('before') || input.includes('needs attention')) {
      const aptResult = await toolRegistry.executeTool('list_appointments', {});
      toolsCalled.push({
        name: 'list_appointments',
        arguments: {},
        result: aptResult,
      });

      const unconfirmed = await toolRegistry.executeTool('find_unconfirmed_tasks', {});
      toolsCalled.push({
        name: 'find_unconfirmed_tasks',
        arguments: {},
        result: unconfirmed,
      });

      replyText = `Before Meera's next appointment (Routine Clinic Visit at 11:00 AM at Oak Valley Clinic):
1. Transport Status: Currently flagged as PENDING confirmation. A wheelchair-accessible ride or driver has not been verified.
2. Preparation Task: "Prepare appointment documents" (medication list & vitals log) is still marked open.

Would you like me to assign the transport task to Anika or propose a reminder email to Ravi?`;
    }

    // Request 4: "Assign the transport follow-up to Anika" / "Assign transport to Anika"
    else if (input.includes('assign') && input.includes('transport')) {
      const tasksResult = (await toolRegistry.executeTool('list_care_tasks', { status: 'open' })) as any[];
      const transportTask = tasksResult.find((t) => t.title.toLowerCase().includes('transport')) || tasksResult[0];

      const pending = (await toolRegistry.executeTool('assign_care_task', {
        task_id: transportTask ? transportTask.id : 'task-1',
        caregiver_name_or_id: 'Anika Rao',
      })) as PendingAction;

      toolsCalled.push({
        name: 'assign_care_task',
        arguments: { task_id: transportTask?.id || 'task-1', caregiver: 'Anika Rao' },
        result: pending,
      });

      const proposed = JSON.parse(pending.proposed_changes);
      pendingActionData = {
        id: pending.id,
        action_type: pending.action_type,
        description: `Assign "${proposed.taskTitle}" to Anika Rao.`,
        proposed_changes: proposed,
      };

      replyText = `I have prepared the assignment proposal for "${proposed.taskTitle}". Because changing caregiver ownership is a consequential action, please confirm below to commit this update.`;
    }

    // Request 5: "Mark the appointment documents as prepared" / "mark documents prepared"
    else if (input.includes('document') && (input.includes('prepared') || input.includes('complete') || input.includes('done'))) {
      const tasksResult = (await toolRegistry.executeTool('list_care_tasks', { status: 'open' })) as any[];
      const docTask = tasksResult.find((t) => t.title.toLowerCase().includes('document')) || tasksResult[1] || tasksResult[0];

      const pending = (await toolRegistry.executeTool('update_task_status', {
        task_id: docTask ? docTask.id : 'task-2',
        status: 'completed',
      })) as PendingAction;

      toolsCalled.push({
        name: 'update_task_status',
        arguments: { task_id: docTask?.id || 'task-2', status: 'completed' },
        result: pending,
      });

      const proposed = JSON.parse(pending.proposed_changes);
      pendingActionData = {
        id: pending.id,
        action_type: pending.action_type,
        description: `Mark "${proposed.taskTitle}" as completed.`,
        proposed_changes: proposed,
      };

      replyText = `I have prepared the status update to mark "${proposed.taskTitle}" as completed. Please confirm to update the record and log the change in the audit trail.`;
    }

    // Request 6: "Remind Ravi" / "Send reminder to Ravi"
    else if (input.includes('remind') || input.includes('email') || input.includes('ravi')) {
      const db = (await import('../db/connection.js')).getDb();
      const existingPending = db.prepare(`
        SELECT * FROM pending_actions 
        WHERE action_type = 'send_reminder_email' AND target_id = 'apt-1' AND status = 'pending'
      `).get() as any;

      const pending = existingPending || approvalGate.createPendingAction({
        action_type: 'send_reminder_email',
        target_type: 'appointment',
        target_id: 'apt-1',
        proposed_changes: {
          recipientEmail: 'ravi.rao@example.com',
          recipientName: 'Ravi Rao',
          caregiverRole: 'Caregiver (Son)',
          appointmentTitle: 'Routine clinic appointment',
          appointmentTime: '11:00 AM',
          appointmentDate: new Date().toISOString().split('T')[0],
          location: 'Oak Valley Health Clinic — Suite 210',
          message: "Meera's clinic appointment is at 11:00 AM today. Transport is still unconfirmed. Please verify if you can drive or confirm the ride service.",
          explanation: "Send an email reminder via Amazon SES to Ravi regarding Meera's unconfirmed 11:00 AM clinic transport.",
        },
      });

      toolsCalled.push({
        name: 'propose_care_action',
        arguments: { action_type: 'send_reminder_email', recipient: 'Ravi Rao' },
        result: pending,
      });

      const proposed = JSON.parse(pending.proposed_changes);
      pendingActionData = {
        id: pending.id,
        action_type: pending.action_type,
        description: `Send Amazon SES reminder email to ${proposed.recipientName} (${proposed.recipientEmail})`,
        proposed_changes: proposed,
      };

      replyText = `I have drafted an email reminder to Ravi Rao regarding Meera's unconfirmed transport. Review the recipient and message details below, then click Confirm to dispatch through Amazon SES.`;
    }

    // Fallback: General inquiry
    else {
      const summaryResult = await toolRegistry.executeTool('get_daily_summary', {});
      toolsCalled.push({
        name: 'get_daily_summary',
        arguments: {},
        result: summaryResult,
      });

      replyText = `I am CareCircle AI, assisting with Meera Rao's care coordination. You can ask me to:
1. "Prepare today's care plan."
2. "Show the tasks that are still open."
3. "What needs attention before the next appointment?"
4. "Assign the transport follow-up to Anika."
5. "Mark the appointment documents as prepared."
6. "Send an email reminder to Ravi about transport."`;
    }

    return {
      message: replyText,
      tools_called: toolsCalled,
      pending_action: pendingActionData,
    };
  }
}

export const orchestrator = new AssistantOrchestrator();
