import { useState } from 'react';
import { ShieldCheck, Mail, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';

interface ApprovalCardProps {
  pendingAction: {
    id: string;
    action_type: string;
    description: string;
    proposed_changes: Record<string, any>;
  };
  onResolved?: (result: any) => void;
}

export function ApprovalCard({ pendingAction, onResolved }: ApprovalCardProps) {
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const proposed = pendingAction.proposed_changes || {};

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.confirmAction(pendingAction.id);
      setStatus('confirmed');
      setExecutionResult(res.result || { details: 'Action verified and executed.' });
      if (onResolved) onResolved(res.result);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('already')) {
        // Idempotent success: action was already executed!
        setStatus('confirmed');
        setError(null);
        setExecutionResult({
          details: 'Action was already verified and executed.',
          mode: 'simulated',
        });
        if (onResolved) onResolved({ already_confirmed: true });
      } else {
        setError(err.message || 'Action approval failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.cancelAction(pendingAction.id);
      setStatus('cancelled');
      if (onResolved) onResolved({ cancelled: true });
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('already')) {
        setStatus('cancelled');
        setError(null);
      } else {
        setError(err.message || 'Failed to cancel action');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`my-3 rounded-2xl border p-4 shadow-sm text-xs transition-colors ${
      status === 'confirmed'
        ? 'border-emerald-300/90 bg-emerald-50/50'
        : 'border-amber-300/80 bg-amber-50/70'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-amber-200/80 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            status === 'confirmed' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
          }`}>
            <ShieldCheck size={16} />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider font-[family-name:var(--font-heading)]">
              {status === 'confirmed' ? 'Operation Approved & Executed' : 'Human Approval Required (FR-6)'}
            </h4>
            <p className="text-[11px] text-stone-600">
              {status === 'confirmed'
                ? 'Consequential mutation verified and recorded in CareCircle audit trail.'
                : 'Consequential operation paused pending caregiver confirmation.'}
            </p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
          status === 'confirmed'
            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            : 'bg-amber-200/70 text-amber-900'
        }`}>
          {status}
        </span>
      </div>

      {/* Description */}
      <div className="space-y-2 mb-3">
        <p className="font-semibold text-stone-900 text-xs">
          {pendingAction.description}
        </p>

        {/* Email action details preview */}
        {pendingAction.action_type === 'send_reminder_email' && (
          <div className="bg-white p-3 rounded-xl border border-amber-200/90 space-y-1.5 text-stone-700">
            <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
              <Mail size={13} />
              <span>Target Recipient: {proposed.recipientName} ({proposed.recipientEmail})</span>
            </div>
            <div className="text-[11px] text-stone-500">
              <strong>Context:</strong> {proposed.appointmentTitle} at {proposed.appointmentTime}
            </div>
            <div className="p-2 rounded bg-stone-50 border border-stone-200/60 text-[11px] text-stone-700 italic">
              "{proposed.message}"
            </div>
          </div>
        )}

        {/* Task assignment preview */}
        {pendingAction.action_type === 'assign_care_task' && (
          <div className="bg-white p-2.5 rounded-xl border border-amber-200/90 text-stone-700">
            <p className="font-semibold text-stone-900">Task: {proposed.taskTitle}</p>
            <p className="text-[11px] text-stone-600 mt-0.5">New Assignee: <strong>{proposed.assigneeName}</strong></p>
          </div>
        )}

        {/* Status update preview */}
        {pendingAction.action_type === 'update_task_status' && (
          <div className="bg-white p-2.5 rounded-xl border border-amber-200/90 text-stone-700">
            <p className="font-semibold text-stone-900">Task: {proposed.taskTitle}</p>
            <p className="text-[11px] text-stone-600 mt-0.5">New Status: <strong className="capitalize">{proposed.status}</strong></p>
          </div>
        )}
      </div>

      {error && status === 'pending' && (
        <div className="mb-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Confirmation State Result */}
      {status === 'confirmed' && executionResult && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
            <Check size={14} className="text-emerald-700" />
            <span>Action Verified & Executed</span>
          </div>
          {executionResult.mode && (
            <div className="text-[11px] text-emerald-800">
              Provider Mode: <strong>{executionResult.mode === 'live' ? 'Live Amazon SES' : 'Simulated Amazon SES Mode'}</strong>
            </div>
          )}
          {executionResult.messageId && (
            <div className="text-[10px] font-mono text-emerald-700">
              Message ID: {executionResult.messageId}
            </div>
          )}
          <p className="text-[11px] text-emerald-900 mt-1">
            {executionResult.details || 'Change committed and recorded in CareCircle audit trail.'}
          </p>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 text-xs">
          Operation cancelled. No changes were made to care records.
        </div>
      )}

      {/* Action Buttons */}
      {status === 'pending' && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Check size={14} />
                Approve & Execute Action
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
