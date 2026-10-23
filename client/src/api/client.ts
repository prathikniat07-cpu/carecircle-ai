const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`)
  : '/api';

// Fast In-Memory Cache for 0ms Instant Page Loads (Stale-While-Revalidate)
const memoryCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds cache TTL

export function clearClientCache(pattern?: string): void {
  if (!pattern) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) memoryCache.delete(key);
    }
  }
}

export function getCachedData<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data as T;
  }
  return null;
}

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

async function cachedGet<T>(path: string, forceFresh = false): Promise<T> {
  const cached = memoryCache.get(path);
  const now = Date.now();

  if (!forceFresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    // If cache is older than 5 seconds, background revalidate silently
    if (now - cached.timestamp > 5_000) {
      request<T>(path)
        .then((data) => {
          memoryCache.set(path, { data, timestamp: Date.now() });
        })
        .catch(() => {});
    }
    return cached.data as T;
  }

  const data = await request<T>(path);
  memoryCache.set(path, { data, timestamp: Date.now() });
  return data;
}

export const api = {
  // Cache utilities
  clearCache: clearClientCache,
  getCached: getCachedData,
  prefetchAll: () => {
    Promise.allSettled([
      api.getDailySummary(),
      api.getTasks(),
      api.getAppointments(),
      api.getCaregivers(),
      api.getActivity(),
    ]).catch(() => {});
  },

  // Health
  health: () => request<{ status: string; database: string; mode: string }>('/health'),

  // Summary
  getDailySummary: (forceFresh = false) =>
    cachedGet<import('../types').DailySummary>('/summary', forceFresh),

  // Tasks
  getTasks: (params?: { status?: string; assigned_to?: string }, forceFresh = false) => {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.assigned_to) search.set('assigned_to', params.assigned_to);
    const qs = search.toString();
    const path = `/tasks${qs ? `?${qs}` : ''}`;
    return cachedGet<import('../types').CareTask[]>(path, forceFresh);
  },
  getTask: (id: string) => request<import('../types').CareTask>(`/tasks/${id}`),
  createTask: async (data: Partial<import('../types').CareTask>) => {
    const res = await request<import('../types').CareTask>('/tasks', { method: 'POST', body: JSON.stringify(data) });
    clearClientCache();
    window.dispatchEvent(new CustomEvent('carecircle-data-updated'));
    return res;
  },
  updateTaskStatus: async (id: string, status: string) => {
    const res = await request<import('../types').CareTask>(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    clearClientCache();
    window.dispatchEvent(new CustomEvent('carecircle-data-updated'));
    return res;
  },
  assignTask: async (id: string, assigned_to: string) => {
    const res = await request<import('../types').CareTask>(`/tasks/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigned_to }) });
    clearClientCache();
    window.dispatchEvent(new CustomEvent('carecircle-data-updated'));
    return res;
  },

  // Appointments
  getAppointments: (forceFresh = false) =>
    cachedGet<import('../types').Appointment[]>('/appointments', forceFresh),
  getAppointment: (id: string) => request<import('../types').Appointment>(`/appointments/${id}`),
  createAppointment: async (data: Partial<import('../types').Appointment>) => {
    const res = await request<import('../types').Appointment>('/appointments', { method: 'POST', body: JSON.stringify(data) });
    clearClientCache();
    window.dispatchEvent(new CustomEvent('carecircle-data-updated'));
    return res;
  },
  updateAppointment: async (id: string, data: Partial<import('../types').Appointment>) => {
    const res = await request<import('../types').Appointment>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    clearClientCache();
    window.dispatchEvent(new CustomEvent('carecircle-data-updated'));
    return res;
  },

  // Caregivers
  getCaregivers: (forceFresh = false) =>
    cachedGet<import('../types').Caregiver[]>('/caregivers', forceFresh),

  // Activity
  getActivity: (forceFresh = false) =>
    cachedGet<import('../types').ActivityEvent[]>('/activity', forceFresh),

  // Assistant
  sendMessage: (message: string, conversationHistory?: import('../types').AssistantMessage[]) =>
    request<{ messages: import('../types').AssistantMessage[] }>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history: conversationHistory }),
    }),
  confirmAction: async (actionId: string) => {
    const res = await request<{ success: boolean; result: unknown }>(`/assistant/confirm/${actionId}`, { method: 'POST' });
    clearClientCache();
    window.dispatchEvent(new CustomEvent('carecircle-data-updated'));
    return res;
  },
  cancelAction: async (actionId: string) => {
    const res = await request<{ success: boolean }>(`/assistant/cancel/${actionId}`, { method: 'POST' });
    clearClientCache();
    window.dispatchEvent(new CustomEvent('carecircle-data-updated'));
    return res;
  },
};
