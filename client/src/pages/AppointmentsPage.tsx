import { useState, useEffect } from 'react';
import {
  CalendarDays,
  MapPin,
  Car,
  FileCheck,
  Plus,
  Info,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';
import type { Appointment } from '../types';
import { StatusBadge } from '../components/shared/StatusBadge';
import { LoadingSkeleton } from '../components/shared/LoadingSkeleton';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('11:00 AM');
  const [duration, setDuration] = useState(45);
  const [location, setLocation] = useState('Oak Valley Health Clinic');
  const [transportStatus, setTransportStatus] = useState<'confirmed' | 'pending' | 'not_needed'>('pending');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleToggleTransport = async (apt: Appointment) => {
    try {
      const nextStatus = apt.transport_status === 'confirmed' ? 'pending' : 'confirmed';
      // Optimistic update
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, transport_status: nextStatus } : a))
      );

      // Call backend
      await api.updateAppointment(apt.id, { transport_status: nextStatus });
    } catch (err) {
      console.error('Failed to update transport:', err);
      loadAppointments();
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setModalError('Appointment title is required');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);
      await api.createAppointment({
        title: title.trim(),
        date,
        time,
        duration_minutes: duration,
        location: location.trim() || null,
        transport_status: transportStatus,
        followup_status: 'pending',
        notes: notes.trim() || null,
      });

      setIsModalOpen(false);
      setTitle('');
      setNotes('');
      await loadAppointments();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error creating appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-stone-900 tracking-tight">
            Care Appointments
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Clinical visits, telehealth reviews, and therapy sessions for Meera.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          Schedule Visit
        </button>
      </div>

      {/* Simulated Calendar Notice */}
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-3 flex items-center gap-3 text-xs text-stone-700">
        <Info size={16} className="text-stone-500 shrink-0" />
        <p>
          <strong>Simulated Care Calendar:</strong> Appointments are managed within CareCircle AI for coordination
          demonstration. No third-party calendar connection is required.
        </p>
      </div>

      {loading && <LoadingSkeleton count={3} />}

      {error && <ErrorState message={error} onRetry={loadAppointments} />}

      {!loading && !error && appointments.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No appointments scheduled"
          description="Keep all family members aligned by adding upcoming clinical appointments and therapy sessions."
          action={{
            label: 'Add Appointment',
            onClick: () => setIsModalOpen(true),
          }}
        />
      )}

      {/* Timeline of Appointments */}
      {!loading && !error && appointments.length > 0 && (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs hover:border-emerald-700/50 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-900 text-white text-xs font-bold font-mono">
                    {apt.time}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-stone-900">{apt.title}</h2>
                    <span className="text-xs text-stone-500 tabular-nums">
                      {new Date(apt.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      • {apt.duration_minutes} mins
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge type="transport" value={apt.transport_status} />
                  <StatusBadge type="followup" value={apt.followup_status} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs text-stone-600">
                <div className="space-y-2">
                  {apt.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-stone-400 shrink-0" />
                      <span>{apt.location}</span>
                    </div>
                  )}

                  {apt.notes && (
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60 text-stone-600 italic">
                      "{apt.notes}"
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between items-start md:items-end gap-3">
                  <div className="flex items-center gap-2">
                    {apt.transport_status === 'pending' ? (
                      <button
                        onClick={() => handleToggleTransport(apt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Car size={13} />
                        Confirm Transport Now
                      </button>
                    ) : apt.transport_status === 'confirmed' ? (
                      <button
                        onClick={() => handleToggleTransport(apt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        <FileCheck size={13} className="text-emerald-700" />
                        Transport Confirmed (Click to Revert)
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Appointment Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-appointment-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h2 id="new-appointment-modal-title" className="text-base font-bold text-stone-900 font-[family-name:var(--font-heading)]">
                  Schedule Care Appointment
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">Add a new medical visit, test, or checkup for Meera Rao.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Appointment Purpose / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ophthalmology eye pressure test"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="02:30 PM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Location or Provider</label>
                <input
                  type="text"
                  placeholder="e.g. Oak Valley Health Clinic or Telehealth link"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Transport Requirement</label>
                <select
                  value={transportStatus}
                  onChange={(e) => setTransportStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                >
                  <option value="pending">Transport Pending (Needs driver/ride)</option>
                  <option value="confirmed">Transport Confirmed</option>
                  <option value="not_needed">Not Needed (Telehealth / Home visit)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Coordination Notes</label>
                <textarea
                  rows={2}
                  placeholder="Items to bring, doctor questions, fasting instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all text-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Check size={14} />
                  {saving ? 'Saving...' : 'Add Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
