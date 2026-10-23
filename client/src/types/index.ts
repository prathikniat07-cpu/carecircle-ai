/* ========================================
   CareCircle AI — Shared Types
   ======================================== */

export interface Caregiver {
  id: string;
  name: string;
  role: string;
  avatar_initials: string;
  avatar_color: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  duration_minutes: number;
  location: string | null;
  transport_status: 'confirmed' | 'pending' | 'not_needed';
  followup_status: 'completed' | 'pending' | 'not_needed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface CareTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  assignee_name?: string;
  assignee_initials?: string;
  assignee_color?: string;
  due_date: string | null;
  due_time: string | null;
  related_appointment_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ActivityResult = 'success' | 'failed' | 'cancelled' | 'pending';

export interface ActivityEvent {
  id: string;
  actor: string;
  action: string;
  target_type: string;
  target_id: string;
  target_label: string;
  details: string | null;
  result: ActivityResult;
  timestamp: string;
}

export interface DailySummary {
  greeting: string;
  date: string;
  total_tasks: number;
  open_tasks: number;
  overdue_tasks: number;
  completed_tasks: number;
  upcoming_appointments: Appointment[];
  priority_tasks: CareTask[];
  recent_activity: ActivityEvent[];
  transport_reminder_sent?: boolean;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  database: string;
  timestamp: string;
  version: string;
  mode: 'live' | 'demo';
}

// Assistant types
export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  confirmation?: PendingConfirmation;
  timestamp: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'running' | 'completed' | 'failed';
}

export interface ToolResult {
  tool_call_id: string;
  name: string;
  result: unknown;
  success: boolean;
}

export interface PendingConfirmation {
  id: string;
  action_type: string;
  description: string;
  proposed_changes: Record<string, unknown>;
  status: 'pending' | 'confirmed' | 'cancelled';
}
