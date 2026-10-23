import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sparkles, Mic } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { AssistantPanel } from '../assistant/AssistantPanel';
import { api } from '../../api/client';

export function AppShell() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Warm up client cache instantly on app load
    api.prefetchAll();

    const handleOpen = (e: CustomEvent<{ query?: string }>) => {
      setInitialQuery(e.detail?.query);
      setIsAssistantOpen(true);
    };

    window.addEventListener('open-carecircle-assistant' as any, handleOpen as any);
    return () => {
      window.removeEventListener('open-carecircle-assistant' as any, handleOpen as any);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 min-w-0 min-h-screen">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button for Assistant */}
      <button
        onClick={() => {
          setInitialQuery(undefined);
          setIsAssistantOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-emerald-900 hover:bg-emerald-950 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer border border-emerald-700/60"
        aria-label="Open CareCircle AI Assistant"
      >
        <Sparkles size={18} className="text-amber-300 animate-pulse" />
        <span className="text-xs font-bold font-[family-name:var(--font-heading)] tracking-wide">
          Ask CareCircle
        </span>
        <div className="w-5 h-5 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-200">
          <Mic size={11} />
        </div>
      </button>

      {/* Assistant Slide-Out Panel */}
      <AssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        initialQuery={initialQuery}
        onStateChanged={() => {
          // Trigger data refresh across window
          window.dispatchEvent(new CustomEvent('carecircle-data-updated'));
        }}
      />
    </div>
  );
}

export function triggerAssistant(query?: string) {
  window.dispatchEvent(new CustomEvent('open-carecircle-assistant', { detail: { query } }));
}
