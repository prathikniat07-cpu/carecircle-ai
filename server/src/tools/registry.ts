import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { approvalGate } from '../ai/gate.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  isConsequential: boolean;
  execute: (args: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerCoreTools();
  }

  private registerCoreTools() {
    // 1. get_daily_summary
    this.register({
      name: 'get_daily_summary',
      description: 'Fetch the comprehensive daily care summary for Meera Rao, including upcoming appointments, priority tasks, and care metrics.',
      parameters: {
        type: 'object',
        properties: {},
      },
      isConsequential: false,
      execute: async () => {
        const db = getDb();
        const today = new Date().toISOString().split('T')[0];
        const openTasks = (db.prepare("SELECT COUNT(*) as count FROM care_tasks WHERE status = 'open' OR status = 'in_progress'").get() as any).count;
        const upcomingAppointments = db.prepare('SELECT * FROM appointments WHERE date >= ? ORDER BY date ASC, time ASC LIMIT 3').all(today);
        const priorityTasks = db.prepare("SELECT * FROM care_tasks WHERE status != 'completed' ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END LIMIT 4").all();

        return {
          recipient: 'Meera Rao',
          date: today,
          open_tasks_count: openTasks,
          upcoming_appointments: upcomingAppointments,
          priority_tasks: priorityTasks,
        };
      },
    });

    // 2. list_appointments
    this.register({
      name: 'list_appointments',
      description: 'Retrieve scheduled medical, clinical, and telehealth appointments.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Optional date filter in YYYY-MM-DD' },
        },
      },
      isConsequential: false,
      execute: async (args: { date?: string }) => {
        const db = getDb();
        if (args?.date) {
          return db.prepare('SELECT * FROM appointments WHERE date = ? ORDER BY time ASC').all(args.date);
        }
        return db.prepare('SELECT * FROM appointments ORDER BY date ASC, time ASC').all();
      },
    });

    // 3. list_care_tasks
    this.register({
      name: 'list_care_tasks',
      description: 'List care checklist tasks, with optional filtering by status (open, completed) or caregiver ID.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['open', 'completed', 'all'], description: 'Filter by task status' },
          assigned_to: { type: 'string', description: 'Filter by caregiver ID (e.g. cg-anika, cg-ravi, or unassigned)' },
        },
      },
      isConsequential: false,
      execute: async (args: { status?: string; assigned_to?: string }) => {
        const db = getDb();
        let query = `
          SELECT t.*, c.name as assignee_name, c.avatar_initials as assignee_initials, c.avatar_color as assignee_color
          FROM care_tasks t
          LEFT JOIN caregivers c ON t.assigned_to = c.id
          WHERE 1=1
        `;
        const params: unknown[] = [];

        if (args?.status && args.status !== 'all') {
          query += ' AND t.status = ?';
          params.push(args.status);
        }

        if (args?.assigned_to) {
          if (args.assigned_to === 'unassigned') {
            query += ' AND t.assigned_to IS NULL';
          } else {
            query += ' AND t.assigned_to = ?';
            params.push(args.assigned_to);
          }
        }

        query += " ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, t.due_time ASC";
        return db.prepare(query).all(...params);
      },
    });

    // 4. get_caregivers
    this.register({
      name: 'get_caregivers',
      description: 'List authorized family caregivers and their roles for Meera Rao.',
      parameters: {
        type: 'object',
        properties: {},
      },
      isConsequential: false,
      execute: async () => {
        const db = getDb();
        return db.prepare('SELECT * FROM caregivers ORDER BY name ASC').all();
      },
    });

    // 5. find_unconfirmed_tasks
    this.register({
      name: 'find_unconfirmed_tasks',
      description: 'Find urgent care tasks that remain unassigned or have unconfirmed transport before upcoming appointments.',
      parameters: {
        type: 'object',
        properties: {},
      },
      isConsequential: false,
      execute: async () => {
        const db = getDb();
        const unassigned = db.prepare("SELECT * FROM care_tasks WHERE assigned_to IS NULL AND status != 'completed'").all();
        const transportIssues = db.prepare("SELECT * FROM appointments WHERE transport_status = 'pending'").all();
        return {
          unassigned_tasks: unassigned,
          appointments_with_pending_transport: transportIssues,
        };
      },
    });

    // 6. propose_care_action (Write - creates a pending confirmation card)
    this.register({
      name: 'propose_care_action',
      description: 'Propose a consequential change (assign task, update status, send reminder) for explicit user approval.',
      parameters: {
        type: 'object',
        required: ['action_type', 'target_type', 'target_id', 'proposed_changes', 'explanation'],
        properties: {
          action_type: {
            type: 'string',
            enum: ['send_reminder_email', 'assign_care_task', 'update_task_status'],
            description: 'The type of action to propose',
          },
          target_type: { type: 'string' },
          target_id: { type: 'string' },
          explanation: { type: 'string', description: 'Clear reason shown to caregiver explaining why this action is proposed' },
          proposed_changes: { type: 'object' },
        },
      },
      isConsequential: true,
      execute: async (args: {
        action_type: any;
        target_type: string;
        target_id: string;
        explanation: string;
        proposed_changes: Record<string, unknown>;
      }) => {
        const pending = approvalGate.createPendingAction({
          action_type: args.action_type,
          target_type: args.target_type,
          target_id: args.target_id,
          proposed_changes: {
            ...args.proposed_changes,
            explanation: args.explanation,
          },
        });

        return {
          requires_confirmation: true,
          action_id: pending.id,
          action_type: pending.action_type,
          explanation: args.explanation,
          proposed_changes: args.proposed_changes,
          status: 'pending_user_approval',
        };
      },
    });

    // 7. assign_care_task
    this.register({
      name: 'assign_care_task',
      description: 'Assign a task to a designated caregiver. Prepares a confirmation proposal if called by assistant.',
      parameters: {
        type: 'object',
        required: ['task_id', 'caregiver_name_or_id'],
        properties: {
          task_id: { type: 'string', description: 'ID of the task to assign' },
          caregiver_name_or_id: { type: 'string', description: 'Caregiver name (e.g. "Anika" or "Ravi") or ID ("cg-anika")' },
        },
      },
      isConsequential: true,
      execute: async (args: { task_id: string; caregiver_name_or_id: string }) => {
        const db = getDb();
        const task = db.prepare('SELECT * FROM care_tasks WHERE id = ?').get(args.task_id) as any;
        if (!task) throw new Error(`Task ${args.task_id} not found`);

        const isRavi = args.caregiver_name_or_id.toLowerCase().includes('ravi');
        const caregiverId = isRavi ? 'cg-ravi' : 'cg-anika';
        const caregiverName = isRavi ? 'Ravi Rao' : 'Anika Rao';

        return approvalGate.createPendingAction({
          action_type: 'assign_care_task',
          target_type: 'care_task',
          target_id: task.id,
          proposed_changes: {
            taskTitle: task.title,
            assigned_to: caregiverId,
            assigneeName: caregiverName,
            explanation: `Assign "${task.title}" to ${caregiverName}.`,
          },
        });
      },
    });

    // 8. update_task_status
    this.register({
      name: 'update_task_status',
      description: 'Update the status of a care task (e.g. mark prepared/completed). Prepares a confirmation proposal.',
      parameters: {
        type: 'object',
        required: ['task_id', 'status'],
        properties: {
          task_id: { type: 'string', description: 'ID of the task' },
          status: { type: 'string', enum: ['open', 'completed', 'in_progress'], description: 'New task status' },
        },
      },
      isConsequential: true,
      execute: async (args: { task_id: string; status: 'open' | 'completed' | 'in_progress' }) => {
        const db = getDb();
        const task = db.prepare('SELECT * FROM care_tasks WHERE id = ?').get(args.task_id) as any;
        if (!task) throw new Error(`Task ${args.task_id} not found`);

        return approvalGate.createPendingAction({
          action_type: 'update_task_status',
          target_type: 'care_task',
          target_id: task.id,
          proposed_changes: {
            taskTitle: task.title,
            status: args.status,
            explanation: `Mark task "${task.title}" as ${args.status}.`,
          },
        });
      },
    });

    // 9. record_activity_event
    this.register({
      name: 'record_activity_event',
      description: 'Write an audit event directly to the CareCircle compliance log.',
      parameters: {
        type: 'object',
        required: ['action', 'target_type', 'target_id', 'target_label'],
        properties: {
          actor: { type: 'string', default: 'CareCircle AI' },
          action: { type: 'string' },
          target_type: { type: 'string' },
          target_id: { type: 'string' },
          target_label: { type: 'string' },
          details: { type: 'string' },
          result: { type: 'string', enum: ['success', 'failed', 'cancelled', 'pending'], default: 'success' },
        },
      },
      isConsequential: false,
      execute: async (args: any) => {
        const db = getDb();
        const id = `act-${Date.now()}`;
        db.prepare(`
          INSERT INTO activity_events (id, actor, action, target_type, target_id, target_label, details, result)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          args.actor || 'CareCircle AI',
          args.action,
          args.target_type,
          args.target_id,
          args.target_label,
          args.details || null,
          args.result || 'success'
        );
        return { success: true, id };
      },
    });
  }

  public register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public async executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool "${name}" is not an allowlisted CareCircle tool.`);
    }
    return tool.execute(args);
  }
}

export const toolRegistry = new ToolRegistry();
