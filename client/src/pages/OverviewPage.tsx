import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  ShieldAlert,
  Car,
  User,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import type { DailySummary, CareTask } from '../types';
import { StatusBadge } from '../components/shared/StatusBadge';
import { CaregiverAvatar } from '../components/shared/CaregiverAvatar';
import { LoadingSkeleton } from '../components/shared/LoadingSkeleton';
import { ErrorState } from '../components/shared/ErrorState';

import { triggerAssistant } from '../components/layout/AppShell';

export function OverviewPage() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDailySummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('carecircle-data-updated', handleUpdate);
    return () => {
      window.removeEventListener('carecircle-data-updated', handleUpdate);
    };
  }, []);

  const handleToggleTask = async (task: CareTask) => {
    try {
      setTogglingTaskId(task.id);
      const newStatus = task.status === 'completed' ? 'open' : 'completed';
      await api.updateTaskStatus(task.id, newStatus);
      await loadData();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    } finally {
      setTogglingTaskId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Demo & Mode Banner */}
      <div className="bg-emerald-900 text-white px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-700/80 px-2 py-0.5 rounded font-semibold tracking-wide uppercase text-[10px]">
            Demo Environment
          </span>
          <span className="text-emerald-100">
            Fictional care records for <strong>Meera Rao (Age 78)</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-200">
          <Sparkles size={14} className="text-amber-300" />
          <span>Simulated Alexa+ Care Experience</span>
        </div>
      </div>

      {/* Header & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-stone-900 tracking-tight">
            {summary ? `${summary.greeting}, Anika` : 'Good morning, Anika'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 tabular-nums">
            {summary?.date || 'Care overview for today'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !summary && <LoadingSkeleton count={3} />}

      {error && !summary && <ErrorState message={error} onRetry={loadData} />}

      {summary && (
        <>
          {/* Key Metrics / Today at a Glance */}
          <section aria-label="Today at a glance">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <Link
                to="/tasks"
                className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs hover:border-emerald-700/50 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-stone-600">Open Tasks</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <ClipboardList size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-[family-name:var(--font-heading)] text-stone-900 tabular-nums">
                    {summary.open_tasks}
                  </span>
                  <span className="text-[11px] text-stone-500">of {summary.total_tasks} total</span>
                </div>
              </Link>

              <Link
                to="/appointments"
                className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs hover:border-emerald-700/50 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-stone-600">Appointments</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <CalendarDays size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-[family-name:var(--font-heading)] text-stone-900 tabular-nums">
                    {summary.upcoming_appointments.length}
                  </span>
                  <span className="text-[11px] text-stone-500">upcoming</span>
                </div>
              </Link>

              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-950">Needs Attention</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <AlertCircle size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-[family-name:var(--font-heading)] text-amber-950 tabular-nums">
                    {summary.upcoming_appointments.filter((a) => a.transport_status === 'pending').length}
                  </span>
                  <span className="text-[11px] text-amber-800">rides pending</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-stone-600">Completed</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-[family-name:var(--font-heading)] text-stone-900 tabular-nums">
                    {summary.completed_tasks}
                  </span>
                  <span className="text-[11px] text-stone-500">done today</span>
                </div>
              </div>
            </div>
          </section>

          {/* Proactive Risk Alert (Enhancement C) */}
          {summary.upcoming_appointments.some((a) => a.transport_status === 'pending') && (
            <div
              className={`border rounded-2xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm transition-all ${
                summary.transport_reminder_sent
                  ? 'bg-emerald-50/70 border-emerald-300/80'
                  : 'bg-amber-50 border-amber-300/80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    summary.transport_reminder_sent
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {summary.transport_reminder_sent ? <CheckCircle2 size={20} /> : <Car size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        summary.transport_reminder_sent
                          ? 'bg-emerald-200/80 text-emerald-950'
                          : 'bg-amber-200/80 text-amber-950'
                      }`}
                    >
                      {summary.transport_reminder_sent ? 'SES Reminder Dispatched' : 'Proactive Coordination Alert'}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        summary.transport_reminder_sent ? 'text-emerald-800' : 'text-amber-800'
                      }`}
                    >
                      {summary.transport_reminder_sent ? '• Awaiting Ravi\'s Verification' : '• High Priority'}
                    </span>
                  </div>
                  <p
                    className={`text-xs font-medium mt-1 leading-relaxed ${
                      summary.transport_reminder_sent ? 'text-emerald-950' : 'text-amber-950'
                    }`}
                  >
                    {summary.transport_reminder_sent ? (
                      <>
                        Automated Amazon SES reminder email has been dispatched to <strong>Ravi Rao</strong> regarding Meera's 11:00 AM clinic visit transport.
                      </>
                    ) : (
                      <>
                        "Meera's Routine clinic appointment is approaching at <strong>11:00 AM</strong>, but transport is still unconfirmed. Would you like me to remind Ravi?"
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <Link
                  to="/appointments"
                  className="px-3 py-1.5 text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium transition-colors"
                >
                  View Visit
                </Link>
                {summary.transport_reminder_sent ? (
                  <button
                    onClick={async () => {
                      const apt = summary.upcoming_appointments.find((a) => a.transport_status === 'pending');
                      if (apt) {
                        await api.updateAppointment(apt.id, { transport_status: 'confirmed' });
                        await loadData();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    title="Mark transport confirmed once verified with Ravi"
                  >
                    <CheckCircle2 size={13} />
                    Confirm Transport
                  </button>
                ) : (
                  <button
                    onClick={() => triggerAssistant("Remind Ravi about Meera's transport.")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles size={13} className="text-amber-300" />
                    Review & Send Reminder
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Two-Column Grid: Priority Tasks & Upcoming Appointments */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left 2 Cols: Priority Tasks & Appointments */}
            <div className="xl:col-span-2 space-y-6">
              {/* Priority Tasks */}
              <section className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-800"></div>
                    <h2 className="text-base font-bold font-[family-name:var(--font-heading)] text-stone-900">
                      Priority Care Tasks
                    </h2>
                  </div>
                  <Link
                    to="/tasks"
                    className="text-xs font-medium text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
                  >
                    View all ({summary.total_tasks})
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {summary.priority_tasks.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4 text-center">No open priority tasks today.</p>
                  ) : (
                    summary.priority_tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`group p-3.5 rounded-lg border transition-all flex items-start gap-3 ${
                          task.status === 'completed'
                            ? 'bg-stone-50/70 border-stone-200 opacity-60'
                            : 'bg-white border-stone-200 hover:border-emerald-700/40 hover:shadow-xs'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleTask(task)}
                          disabled={togglingTaskId === task.id}
                          className="mt-0.5 text-stone-400 hover:text-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                          title={task.status === 'completed' ? 'Reopen task' : 'Mark task complete'}
                          aria-label={task.status === 'completed' ? `Reopen ${task.title}` : `Complete ${task.title}`}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 size={18} className="text-emerald-700" />
                          ) : (
                            <div className="w-4.5 h-4.5 rounded-md border-2 border-stone-300 group-hover:border-emerald-700 transition-colors"></div>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-xs font-semibold leading-snug truncate ${
                                task.status === 'completed' ? 'line-through text-stone-500' : 'text-stone-900'
                              }`}
                            >
                              {task.title}
                            </span>
                            <StatusBadge type="priority" value={task.priority} />
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-stone-600 mt-1 line-clamp-1">{task.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-stone-500">
                            {task.due_time && (
                              <span className="flex items-center gap-1 tabular-nums">
                                <Clock size={12} className="text-stone-400" />
                                Due {task.due_time}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 ml-auto">
                              {task.assignee_name ? (
                                <>
                                  <CaregiverAvatar
                                    name={task.assignee_name}
                                    initials={task.assignee_initials}
                                    color={task.assignee_color}
                                    size="sm"
                                  />
                                  <span className="text-stone-700 font-medium">{task.assignee_name}</span>
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-medium border border-amber-200">
                                  <User size={10} />
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Upcoming Appointments */}
              <section className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-800"></div>
                    <h2 className="text-base font-bold font-[family-name:var(--font-heading)] text-stone-900">
                      Upcoming Care Schedule
                    </h2>
                  </div>
                  <Link
                    to="/appointments"
                    className="text-xs font-medium text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
                  >
                    All appointments
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="space-y-3">
                  {summary.upcoming_appointments.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4 text-center">No appointments scheduled.</p>
                  ) : (
                    summary.upcoming_appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-4 rounded-lg border border-stone-200 bg-stone-50/40 hover:bg-white hover:border-emerald-700/40 hover:shadow-xs transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-1 rounded bg-emerald-900 text-white text-[11px] font-bold tracking-tight tabular-nums">
                              {apt.time}
                            </span>
                            <h3 className="text-xs font-bold text-stone-900">{apt.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge type="transport" value={apt.transport_status} />
                            <StatusBadge type="followup" value={apt.followup_status} />
                          </div>
                        </div>

                        {apt.location && (
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-600 mt-2">
                            <MapPin size={12} className="text-stone-400 shrink-0" />
                            <span>{apt.location}</span>
                          </div>
                        )}

                        {apt.notes && (
                          <p className="text-[11px] text-stone-500 mt-1.5 pl-4 border-l-2 border-stone-200 italic">
                            "{apt.notes}"
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Recent Activity & Caregivers */}
            <div className="space-y-6">
              {/* Care Circle Family Card */}
              <section className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-[family-name:var(--font-heading)]">
                    Care Circle
                  </h2>
                  <Link to="/family" className="text-xs text-emerald-800 hover:text-emerald-950 font-medium">
                    Manage
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-stone-50 border border-stone-200/60">
                    <CaregiverAvatar name="Anika Rao" initials="AR" color="#23483D" size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-stone-900">Anika Rao</p>
                      <p className="text-[11px] text-stone-500">Primary Caregiver • Daughter</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-stone-50 border border-stone-200/60">
                    <CaregiverAvatar name="Ravi Rao" initials="RR" color="#2D5A4C" size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-stone-900">Ravi Rao</p>
                      <p className="text-[11px] text-stone-500">Caregiver • Son</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recent Activity Audit Stream */}
              <section className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} className="text-emerald-800" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-[family-name:var(--font-heading)]">
                      Audit Trail
                    </h2>
                  </div>
                  <Link to="/activity" className="text-xs text-emerald-800 hover:text-emerald-950 font-medium">
                    Full Log
                  </Link>
                </div>

                <div className="space-y-3">
                  {summary.recent_activity.map((event) => (
                    <div key={event.id} className="text-xs border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span className="font-semibold text-stone-800 truncate">{event.actor}</span>
                        <span className="text-[10px] text-stone-400 tabular-nums shrink-0">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-700 font-medium mt-0.5">{event.target_label}</p>
                      {event.details && (
                        <div className="mt-1.5 text-[11px] text-stone-500 bg-stone-50 rounded-lg p-2 border border-stone-200/60">
                          {event.details.includes('[Simulated SES Mode]') ? (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 w-fit">
                                SES Simulated
                              </span>
                              <span className="font-mono text-[10px] text-stone-600 break-all leading-tight">
                                {event.details.replace('[Simulated SES Mode] ', '')}
                              </span>
                            </div>
                          ) : (
                            <p className="line-clamp-2 leading-relaxed">{event.details}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
