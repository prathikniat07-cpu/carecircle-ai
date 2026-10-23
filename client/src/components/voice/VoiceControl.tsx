import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, VolumeX } from 'lucide-react';

interface VoiceControlProps {
  onTranscript: (transcript: string) => void;
  isProcessing?: boolean;
}

export function VoiceControl({ onTranscript, isProcessing }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscriptPreview('');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscriptPreview(transcript);

      if (event.results[current].isFinal) {
        setIsListening(false);
        onTranscript(transcript);
        setTranscriptPreview('');
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Voice recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscriptPreview('');
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting voice capture:', err);
      }
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!speechSupported) {
    return (
      <span
        title="Web Speech API not supported in this browser"
        className="text-[10px] text-stone-400 flex items-center gap-1"
      >
        <MicOff size={13} /> Voice unavailable
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Visual Transcript Preview while talking */}
      {isListening && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
          <span>{transcriptPreview ? `"${transcriptPreview}"` : 'Listening... Speak now'}</span>
        </div>
      )}

      {/* Voice Toggle Button */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={isProcessing}
        className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
          isListening
            ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400 ring-offset-1'
            : 'bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 border border-stone-200'
        } disabled:opacity-50`}
        title={isListening ? 'Stop listening (Cancel voice)' : 'Hands-busy voice input (Ask CareCircle)'}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>

      {/* Mute Spoken Audio if speech synthesis active */}
      {isSpeaking && (
        <button
          type="button"
          onClick={stopSpeaking}
          className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs"
          title="Stop reading aloud"
        >
          <VolumeX size={15} />
        </button>
      )}
    </div>
  );
}

export function speakText(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // Stop any ongoing speech
  const clean = text.replace(/[•*_—]/g, ' ').replace(/\n+/g, '. ');
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
