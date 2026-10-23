import { useState, useEffect } from 'react';
import { Users, Heart, Phone, MapPin, CheckCircle, ShieldCheck, ClipboardList } from 'lucide-react';
import { api } from '../api/client';
import type { Caregiver, CareTask } from '../types';
import { CaregiverAvatar } from '../components/shared/CaregiverAvatar';
import { LoadingSkeleton } from '../components/shared/LoadingSkeleton';
import { ErrorState } from '../components/shared/ErrorState';

export function FamilyPage() {
  const cachedCaregivers = api.getCached<Caregiver[]>('/caregivers');
  const cachedTasks = api.getCached<CareTask[]>('/tasks');
  const [caregivers, setCaregivers] = useState<Caregiver[]>(cachedCaregivers || []);
  const [tasks, setTasks] = useState<CareTask[]>(cachedTasks || []);
  const [loading, setLoading] = useState(!cachedCaregivers);
  const [error, setError] = useState<string | null>(null);

  const load = async (force = false) => {
    try {
      if (!cachedCaregivers && !caregivers.length) setLoading(true);
      setError(null);
      const [cgs, allTasks] = await Promise.all([
        api.getCaregivers(force),
        api.getTasks(undefined, force),
      ]);
      setCaregivers(cgs);
      setTasks(allTasks);
    } catch (err) {
      if (!caregivers.length) {
        setError(err instanceof Error ? err.message : 'Failed to load family circle');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const handleUpdate = () => load(true);
    window.addEventListener('carecircle-data-updated', handleUpdate);
    return () => window.removeEventListener('carecircle-data-updated', handleUpdate);
  }, []);

  const getTaskStats = (caregiverId: string) => {
    const cgTasks = tasks.filter((t) => t.assigned_to === caregiverId);
    const completed = cgTasks.filter((t) => t.status === 'completed').length;
    const open = cgTasks.filter((t) => t.status !== 'completed').length;
    return { total: cgTasks.length, completed, open };
  };

  const unassignedTasksCount = tasks.filter((t) => !t.assigned_to && t.status !== 'completed').length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-stone-200">
        <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-stone-900 tracking-tight">
          Care Circle & Family
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Care recipient details, active family caregivers, and coordinated task allocation.
        </p>
      </div>

      {loading && <LoadingSkeleton count={3} />}

      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          {/* Care Recipient Card */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xl font-[family-name:var(--font-heading)] shadow-xs">
                  MR
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-900">Meera Rao</h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Care Recipient
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Age 78 • Oak Valley, CA • Preferred language: English
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-600 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200/80">
                <Heart size={14} className="text-rose-600" />
                <span>Primary Care Plan Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs text-stone-600">
              <div className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/60">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Primary Contact
                </span>
                <p className="font-semibold text-stone-800">Anika Rao (Daughter)</p>
                <div className="flex items-center gap-1.5 text-stone-500 mt-1">
                  <Phone size={12} />
                  <span>(555) 234-8901 (Fictional)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/60">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Primary Clinic
                </span>
                <p className="font-semibold text-stone-800">Oak Valley Health Clinic</p>
                <div className="flex items-center gap-1.5 text-stone-500 mt-1">
                  <MapPin size={12} />
                  <span>Dr. Henderson (Cardiology)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/60">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Unassigned Follow-ups
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-amber-950 font-[family-name:var(--font-heading)]">
                    {unassignedTasksCount}
                  </span>
                  <span className="text-stone-500 text-xs">open tasks without an owner</span>
                </div>
              </div>
            </div>
          </section>

          {/* Caregivers Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-900" />
                <h2 className="text-base font-bold font-[family-name:var(--font-heading)] text-stone-900">
                  Active Caregivers
                </h2>
              </div>
              <span className="text-xs text-stone-500">{caregivers.length} family members coordinating</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caregivers.map((cg) => {
                const stats = getTaskStats(cg.id);
                return (
                  <div
                    key={cg.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-emerald-700/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <CaregiverAvatar
                          name={cg.name}
                          initials={cg.avatar_initials}
                          color={cg.avatar_color}
                          size="lg"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-stone-900">{cg.name}</h3>
                          <p className="text-xs text-stone-500">{cg.role}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <ShieldCheck size={11} />
                        Authorized
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-xs">
                      <div className="p-2.5 rounded-lg bg-stone-50">
                        <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                          Open Tasks
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ClipboardList size={13} className="text-stone-400" />
                          <span className="text-base font-bold text-stone-900">{stats.open}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-50/50">
                        <span className="text-[10px] text-emerald-800 uppercase tracking-wider block">
                          Completed
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <CheckCircle size={13} className="text-emerald-700" />
                          <span className="text-base font-bold text-emerald-900">{stats.completed}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
