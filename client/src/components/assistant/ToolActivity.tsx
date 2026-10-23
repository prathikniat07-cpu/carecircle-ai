import { useState } from 'react';
import { Terminal, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

interface ToolActivityProps {
  toolCalls: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result: unknown;
  }>;
}

export function ToolActivity({ toolCalls }: ToolActivityProps) {
  const [expanded, setExpanded] = useState(false);

  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="my-2 p-2.5 rounded-xl bg-stone-100/80 border border-stone-200/80 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-stone-700 hover:text-stone-900 font-mono text-[11px] cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Terminal size={13} className="text-emerald-800" />
          <span className="font-semibold text-stone-800">
            {toolCalls.length} structured tool{toolCalls.length > 1 ? 's' : ''} executed
          </span>
        </div>
        <div className="flex items-center gap-1 text-stone-500 text-[10px]">
          <span>{expanded ? 'Hide details' : 'Inspect data'}</span>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 pt-2 border-t border-stone-200/60 font-mono text-[11px]">
          {toolCalls.map((t, idx) => (
            <div key={idx} className="bg-white p-2 rounded-lg border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-emerald-900 font-semibold mb-1">
                <span>⚡ {t.name}()</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <CheckCircle2 size={11} />
                  Verified
                </span>
              </div>
              {Object.keys(t.arguments || {}).length > 0 && (
                <div className="text-[10px] text-stone-500 mb-1">
                  Args: {JSON.stringify(t.arguments)}
                </div>
              )}
              <div className="max-h-32 overflow-y-auto text-[10px] bg-stone-50 p-1.5 rounded text-stone-700 border border-stone-100">
                <pre className="whitespace-pre-wrap">{JSON.stringify(t.result, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
