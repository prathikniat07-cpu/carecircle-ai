import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  FileText,
  CheckCircle2,
  UserCheck,
  CalendarPlus,
  Bell,
  Mail,
} from 'lucide-react';
import { api } from '../api/client';
import type { ActivityEvent } from '../types';
import { StatusBadge } from '../components/shared/StatusBadge';
import { LoadingSkeleton } from '../components/shared/LoadingSkeleton';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';

export function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getActivity();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  const getActionMeta = (action: string) => {
    switch (action) {
      case 'ses_reminder_simulated':
        return {
          label: 'SES Reminder (Simulated)',
          badgeClass: 'bg-amber-50 text-amber-900 border-amber-200/80',
          icon: Bell,
        };
      case 'ses_reminder_sent':
        return {
          label: 'SES Email Sent',
          badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
          icon: Mail,
        };
      case 'appointment_alert':
        return {
          label: 'Proactive Alert',
          badgeClass: 'bg-rose-50 text-rose-900 border-rose-200/80',
          icon: ShieldAlert,
        };
      case 'task_completed':
        return {
          label: 'Task Completed',
          badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
          icon: CheckCircle2,
        };
      case 'task_assigned':
        return {
          label: 'Task Assigned',
          badgeClass: 'bg-sky-50 text-sky-900 border-sky-200/80',
          icon: UserCheck,
        };
      case 'task_created':
        return {
          label: 'Task Created',
          badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200/80',
          icon: FileText,
        };
      case 'appointment_created':
      case 'appointment_updated':
        return {
          label: action === 'appointment_created' ? 'Visit Scheduled' : 'Visit Updated',
          badgeClass: 'bg-teal-50 text-teal-900 border-teal-200/80',
          icon: CalendarPlus,
        };
      default:
        return {
          label: action.replace(/_/g, ' '),
          badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
          icon: FileText,
        };
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-stone-900 tracking-tight">
            Activity & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Complete, timestamped log of all care actions, assignments, and verified Amazon SES executions.
          </p>
        </div>
        <button
          onClick={loadActivity}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh Log
        </button>
      </div>

      {/* Safety Specification Note */}
      <div className="bg-emerald-950/5 border border-emerald-900/15 rounded-xl p-3.5 flex items-start gap-3 text-xs text-stone-700">
        <ShieldAlert size={16} className="text-emerald-900 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-emerald-950">Audit Compliance (FR-6):</strong> Every consequential mutation—whether triggered
          manually or via AI agent tool execution—is validated and recorded with actor identity, target reference, timestamp, and verified result.
        </div>
      </div>

      {loading && <LoadingSkeleton count={4} />}

      {error && <ErrorState message={error} onRetry={loadActivity} />}

      {!loading && !error && events.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title="No activity recorded yet"
          description="Actions taken across CareCircle will appear here automatically."
        />
      )}

      {/* Timeline of events */}
      {!loading && !error && events.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-xs overflow-hidden">
          {events.map((evt) => {
            const meta = getActionMeta(evt.action);
            const IconComponent = meta.icon;

            return (
              <div key={evt.id} className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-stone-50/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 mt-0.5 text-stone-700">
                  <IconComponent size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-stone-900">{evt.actor}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge type="activity-result" value={evt.result} />
                      <span className="text-[11px] text-stone-400 tabular-nums">
                        {new Date(evt.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-stone-800">{evt.target_label}</p>
                  
                  {evt.details && (
                    <div className="mt-2 text-xs bg-stone-50/90 border border-stone-200/70 rounded-lg p-2.5 max-w-3xl">
                      {evt.details.includes('[Simulated SES Mode]') ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                              Simulated SES
                            </span>
                            <span className="text-[11px] font-mono text-stone-600 break-all">
                              {evt.details.replace('[Simulated SES Mode] ', '')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-stone-600 leading-relaxed">{evt.details}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
