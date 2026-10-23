import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'Something unexpected happened while retrieving care records. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 rounded-xl border border-rose-200">
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
        <AlertCircle size={22} />
      </div>
      <h3 className="text-sm font-semibold text-rose-950 mb-1">{title}</h3>
      <p className="text-xs text-rose-800 max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-900 bg-white hover:bg-rose-50 border border-rose-300 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw size={13} />
          Try again
        </button>
      )}
    </div>
  );
}
