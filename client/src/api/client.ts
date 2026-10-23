const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`)
  : '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Health
  health: () => request<{ status: string; database: string; mode: string }>('/health'),

  // Summary
  getDailySummary: () => request<import('../types').DailySummary>('/summary'),

  // Tasks
  getTasks: (params?: { status?: string; assigned_to?: string }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.assigned_to) search.set('assigned_to', params.assigned_to);
    const qs = search.toString();
    return request<import('../types').CareTask[]>(`/tasks${qs ? `?${qs}` : ''}`);
  },
  getTask: (id: string) => request<import('../types').CareTask>(`/tasks/${id}`),
  createTask: (data: Partial<import('../types').CareTask>) =>
    request<import('../types').CareTask>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTaskStatus: (id: string, status: string) =>
    request<import('../types').CareTask>(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignTask: (id: string, assigned_to: string) =>
    request<import('../types').CareTask>(`/tasks/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigned_to }) }),

  // Appointments
  getAppointments: () => request<import('../types').Appointment[]>('/appointments'),
  getAppointment: (id: string) => request<import('../types').Appointment>(`/appointments/${id}`),
  updateAppointment: (id: string, data: Partial<import('../types').Appointment>) =>
    request<import('../types').Appointment>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Caregivers
  getCaregivers: () => request<import('../types').Caregiver[]>('/caregivers'),

  // Activity
  getActivity: () => request<import('../types').ActivityEvent[]>('/activity'),

  // Assistant
  sendMessage: (message: string, conversationHistory?: import('../types').AssistantMessage[]) =>
    request<{ messages: import('../types').AssistantMessage[] }>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history: conversationHistory }),
    }),
  confirmAction: (actionId: string) =>
    request<{ success: boolean; result: unknown }>(`/assistant/confirm/${actionId}`, { method: 'POST' }),
  cancelAction: (actionId: string) =>
    request<{ success: boolean }>(`/assistant/cancel/${actionId}`, { method: 'POST' }),
};
