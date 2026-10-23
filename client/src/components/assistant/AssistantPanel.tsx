import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RefreshCw,
  Volume2,
} from 'lucide-react';
import { api } from '../../api/client';
import { ToolActivity } from './ToolActivity';
import { ApprovalCard } from './ApprovalCard';
import { VoiceControl, speakText } from '../voice/VoiceControl';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  tools_called?: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result: unknown;
  }>;
  pending_action?: {
    id: string;
    action_type: string;
    description: string;
    proposed_changes: Record<string, any>;
  };
  timestamp: string;
}

const SUGGESTED_QUERIES = [
  "Prepare today's care plan.",
  "Show the tasks that are still open.",
  "What needs attention before the next appointment?",
  "Assign the transport follow-up to Anika.",
  "Mark the appointment documents as prepared.",
  "Remind Ravi about Meera's transport.",
];

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStateChanged?: () => void;
  initialQuery?: string;
}

export function AssistantPanel({
  isOpen,
  onClose,
  onStateChanged,
  initialQuery,
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello Anika. I am CareCircle AI, coordinating Meera Rao's care schedule and daily tasks. You can ask me to prepare today's plan, review open items, or propose reminders for family caregivers.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const res = await api.sendMessage(text);
      const assistantMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        sender: 'assistant',
        text: (res as any).message || 'I processed your request against the care records.',
        tools_called: (res as any).tools_called,
        pending_action: (res as any).pending_action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Speak response if voice playback is active
      if (voicePlaybackEnabled && assistantMsg.text) {
        speakText(assistantMsg.text);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `I encountered an issue executing this care coordination request: ${err.message || 'Please check your connection.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionResolved = () => {
    if (onStateChanged) onStateChanged();
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white border-l border-stone-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      aria-label="CareCircle AI Assistant"
    >
      {/* Header */}
      <div className="p-4 bg-emerald-900 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-300">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold font-[family-name:var(--font-heading)] leading-none">
              CareCircle Assistant
            </h3>
            <span className="text-[10px] text-emerald-200">
              Simulated Alexa+ Care Experience
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoicePlaybackEnabled(!voicePlaybackEnabled)}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              voicePlaybackEnabled ? 'bg-emerald-800 text-amber-300' : 'text-emerald-300/60 hover:text-white'
            }`}
            title={voicePlaybackEnabled ? 'Voice playback active (Click to mute)' : 'Voice playback muted'}
          >
            <Volume2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
            aria-label="Close assistant"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Suggested Quick Action Chips */}
      <div className="p-3 bg-stone-50 border-b border-stone-200 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap text-[11px]">
          <span className="text-stone-400 font-semibold uppercase tracking-wider text-[9px] shrink-0">
            Suggested:
          </span>
          {SUGGESTED_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 hover:border-emerald-700/50 text-stone-700 hover:text-emerald-900 border border-stone-200/90 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-stone-400">
              {msg.sender === 'assistant' ? (
                <>
                  <Bot size={12} className="text-emerald-800" />
                  <span className="font-semibold text-stone-600">CareCircle AI</span>
                </>
              ) : (
                <>
                  <User size={12} className="text-stone-500" />
                  <span className="font-semibold text-stone-600">You (Anika)</span>
                </>
              )}
              <span>• {msg.timestamp}</span>
            </div>

            <div
              className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-emerald-900 text-white rounded-tr-xs'
                  : 'bg-stone-100 text-stone-900 rounded-tl-xs border border-stone-200/60 shadow-xs'
              }`}
            >
              {msg.text}
            </div>

            {/* Structured Tool Call Activity */}
            {msg.tools_called && msg.tools_called.length > 0 && (
              <div className="w-full max-w-[95%]">
                <ToolActivity toolCalls={msg.tools_called} />
              </div>
            )}

            {/* Approval Confirmation Card */}
            {msg.pending_action && (
              <div className="w-full max-w-[95%]">
                <ApprovalCard
                  pendingAction={msg.pending_action}
                  onResolved={handleActionResolved}
                />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl text-stone-500 text-xs animate-pulse">
            <RefreshCw size={14} className="animate-spin text-emerald-800" />
            <span>Consulting care records & evaluating tools...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Hands-Busy Voice Input */}
          <VoiceControl
            onTranscript={(transcript) => handleSendMessage(transcript)}
            isProcessing={isProcessing}
          />

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask CareCircle (or speak via microphone)..."
            disabled={isProcessing}
            className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-800 focus:bg-white transition-colors"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white transition-colors disabled:opacity-40 cursor-pointer"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </aside>
  );
}
