interface StatusBadgeProps {
  type: 'task-status' | 'priority' | 'transport' | 'followup' | 'activity-result';
  value: string;
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  let label = value.replace(/_/g, ' ');
  let colorStyles = 'bg-stone-100 text-stone-700 border-stone-200';

  if (type === 'task-status') {
    switch (value) {
      case 'completed':
        label = 'Completed';
        colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        break;
      case 'in_progress':
        label = 'In Progress';
        colorStyles = 'bg-blue-50 text-blue-800 border-blue-200';
        break;
      case 'overdue':
        label = 'Overdue';
        colorStyles = 'bg-rose-50 text-rose-800 border-rose-200';
        break;
      case 'open':
      default:
        label = 'Open';
        colorStyles = 'bg-stone-100 text-stone-700 border-stone-200';
        break;
    }
  } else if (type === 'priority') {
    switch (value) {
      case 'high':
        label = 'High Priority';
        colorStyles = 'bg-amber-50 text-amber-900 border-amber-200';
        break;
      case 'medium':
        label = 'Medium';
        colorStyles = 'bg-emerald-50/60 text-emerald-900 border-emerald-200/60';
        break;
      case 'low':
      default:
        label = 'Low';
        colorStyles = 'bg-stone-100 text-stone-600 border-stone-200';
        break;
    }
  } else if (type === 'transport') {
    switch (value) {
      case 'confirmed':
        label = 'Transport Confirmed';
        colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        break;
      case 'pending':
        label = 'Transport Pending';
        colorStyles = 'bg-amber-50 text-amber-900 border-amber-300 font-medium';
        break;
      case 'not_needed':
      default:
        label = 'No Ride Needed';
        colorStyles = 'bg-stone-100 text-stone-600 border-stone-200';
        break;
    }
  } else if (type === 'followup') {
    switch (value) {
      case 'completed':
        label = 'Follow-up Done';
        colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        break;
      case 'pending':
        label = 'Follow-up Needed';
        colorStyles = 'bg-amber-50 text-amber-900 border-amber-200';
        break;
      case 'not_needed':
      default:
        label = 'No Follow-up';
        colorStyles = 'bg-stone-100 text-stone-600 border-stone-200';
        break;
    }
  } else if (type === 'activity-result') {
    switch (value) {
      case 'success':
        label = 'Success';
        colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        break;
      case 'cancelled':
        label = 'Cancelled';
        colorStyles = 'bg-stone-100 text-stone-600 border-stone-200';
        break;
      case 'failed':
        label = 'Failed';
        colorStyles = 'bg-rose-50 text-rose-800 border-rose-200';
        break;
      case 'pending':
      default:
        label = 'Pending';
        colorStyles = 'bg-amber-50 text-amber-900 border-amber-200';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorStyles} capitalize`}
    >
      {label}
    </span>
  );
}
