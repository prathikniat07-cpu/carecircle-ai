import { useState, useEffect } from 'react';
import { Plus, Filter, CheckCircle2, Clock, X, Check, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import type { CareTask, Caregiver } from '../types';
import { StatusBadge } from '../components/shared/StatusBadge';
import { CaregiverAvatar } from '../components/shared/CaregiverAvatar';
import { LoadingSkeleton } from '../components/shared/LoadingSkeleton';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';

export function TasksPage() {
  const cachedTasks = api.getCached<CareTask[]>('/tasks');
  const cachedCaregivers = api.getCached<Caregiver[]>('/caregivers');
  const [tasks, setTasks] = useState<CareTask[]>(cachedTasks || []);
  const [caregivers, setCaregivers] = useState<Caregiver[]>(cachedCaregivers || []);
  const [loading, setLoading] = useState(!cachedTasks);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // New Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newAssignee, setNewAssignee] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newDueTime, setNewDueTime] = useState<string>('12:00 PM');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadData = async (force = false) => {
    try {
      if (!cachedTasks && !tasks.length) setLoading(true);
      setError(null);
      const [fetchedTasks, fetchedCaregivers] = await Promise.all([
        api.getTasks(undefined, force),
        api.getCaregivers(force),
      ]);
      setTasks(fetchedTasks);
      setCaregivers(fetchedCaregivers);
    } catch (err) {
      if (!tasks.length) {
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData(true);
    window.addEventListener('carecircle-data-updated', handleUpdate);
    return () => window.removeEventListener('carecircle-data-updated', handleUpdate);
  }, []);

  const handleToggleStatus = async (task: CareTask) => {
    try {
      const nextStatus = task.status === 'completed' ? 'open' : 'completed';
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      await api.updateTaskStatus(task.id, nextStatus);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      // Rollback on failure
      loadData();
    }
  };

  const handleAssignCaregiver = async (taskId: string, caregiverId: string | null) => {
    try {
      const assigned_to = caregiverId === 'unassigned' || !caregiverId ? '' : caregiverId;
      await api.assignTask(taskId, assigned_to);
      await loadData();
    } catch (err) {
      console.error('Failed to assign task:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError('Task title is required');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      await api.createTask({
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        priority: newPriority,
        assigned_to: newAssignee || null,
        due_date: newDueDate || null,
        due_time: newDueTime || null,
        status: 'open',
      });

      // Reset form & close modal
      setNewTitle('');
      setNewDesc('');
      setNewPriority('medium');
      setNewAssignee('');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  // Filter tasks in memory
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'open' && task.status === 'completed') return false;
    if (statusFilter === 'completed' && task.status !== 'completed') return false;
    if (statusFilter === 'high' && task.priority !== 'high') return false;

    if (assigneeFilter === 'unassigned' && task.assigned_to) return false;
    if (assigneeFilter !== 'all' && assigneeFilter !== 'unassigned' && task.assigned_to !== assigneeFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-stone-900 tracking-tight">
            Care Tasks
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Track, assign, and coordinate daily follow-ups for Meera Rao.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          New Care Task
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-stone-400 font-medium inline-flex items-center gap-1">
            <Filter size={13} />
            Status:
          </span>
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'open', label: 'Open' },
            { id: 'completed', label: 'Completed' },
            { id: 'high', label: 'High Priority' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-900 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-stone-500 font-medium">Caregiver:</span>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-2.5 py-1 rounded-md border border-stone-200 bg-stone-50 text-stone-800 text-xs focus:ring-1 focus:ring-emerald-800 cursor-pointer"
          >
            <option value="all">Everyone</option>
            {caregivers.map((cg) => (
              <option key={cg.id} value={cg.id}>
                {cg.name}
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {loading && <LoadingSkeleton count={4} />}

      {error && <ErrorState message={error} onRetry={loadData} />}

      {!loading && !error && filteredTasks.length === 0 && (
        <EmptyState
          title="No tasks found"
          description="There are no tasks matching your selected filters. Create a new task or reset the filters."
          action={{
            label: 'Create Task',
            onClick: () => setIsModalOpen(true),
          }}
        />
      )}

      {/* Task List */}
      {!loading && !error && filteredTasks.length > 0 && (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                task.status === 'completed'
                  ? 'bg-stone-50/60 border-stone-200 opacity-70'
                  : 'bg-white border-stone-200 hover:border-emerald-700/50 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <button
                  onClick={() => handleToggleStatus(task)}
                  className="mt-0.5 text-stone-400 hover:text-emerald-800 transition-colors cursor-pointer shrink-0"
                  title={task.status === 'completed' ? 'Reopen task' : 'Mark complete'}
                  aria-label={task.status === 'completed' ? `Reopen ${task.title}` : `Complete ${task.title}`}
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 size={20} className="text-emerald-700" />
                  ) : (
                    <div className="w-5 h-5 rounded-md border-2 border-stone-300 hover:border-emerald-700 transition-colors"></div>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3
                      className={`text-sm font-bold ${
                        task.status === 'completed' ? 'line-through text-stone-500' : 'text-stone-900'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <StatusBadge type="priority" value={task.priority} />
                    <StatusBadge type="task-status" value={task.status} />
                  </div>

                  {task.description && (
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-stone-500">
                    {task.due_time && (
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock size={13} className="text-stone-400" />
                        Due {task.due_time} {task.due_date ? `(${task.due_date})` : ''}
                      </span>
                    )}

                    {task.related_appointment_id && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                        Linked to Clinic Appointment
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assignee Picker */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-1.5">
                  <CaregiverAvatar
                    name={task.assignee_name}
                    initials={task.assignee_initials}
                    color={task.assignee_color}
                    size="sm"
                  />
                  <select
                    value={task.assigned_to || 'unassigned'}
                    onChange={(e) => handleAssignCaregiver(task.id, e.target.value)}
                    className="text-xs font-medium text-stone-800 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2 py-1 cursor-pointer focus:ring-1 focus:ring-emerald-800"
                    aria-label={`Assignee for ${task.title}`}
                  >
                    <option value="unassigned">Unassigned</option>
                    {caregivers.map((cg) => (
                      <option key={cg.id} value={cg.id}>
                        {cg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Task Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-task-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h2 id="new-task-modal-title" className="text-base font-bold text-stone-900 font-[family-name:var(--font-heading)]">
                  Create Care Task
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">Add a new caregiving task or reminder for Meera Rao.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule cardiologist follow-up"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Add specific instructions or context for family caregivers..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Assign To</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                  >
                    <option value="">Unassigned</option>
                    {caregivers.map((cg) => (
                      <option key={cg.id} value={cg.id}>
                        {cg.name} ({cg.avatar_initials})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Due Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 11:30 AM"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                  />
                </div>
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
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Check size={14} />
                  {creating ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
