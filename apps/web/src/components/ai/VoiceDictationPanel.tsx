import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Upload, Loader2, CheckCircle } from 'lucide-react';
import { useVoiceStore } from '@/store/voice.store';
import { fetchStream } from '@/api/client';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface VoiceDictationPanelProps {
  onTranscribed: (markdown: string) => void;
}

export function VoiceDictationPanel({ onTranscribed }: VoiceDictationPanelProps) {
  const { state, transcript, error, setState, setTranscript, appendTranscript, setError, reset } =
    useVoiceStore();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRealtime = useCallback(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setError('Web Speech API not supported in this browser. Please use file upload instead.');
      return;
    }

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) {
          finalTranscript += result[0]?.transcript ?? '';
        } else {
          interim += result?.[0]?.transcript ?? '';
        }
      }
      setTranscript(finalTranscript + (interim ? ` [${interim}]` : ''));
    };

    recognition.onerror = (event) => setError(`Speech recognition error: ${event.error}`);

    recognition.start();
    recognitionRef.current = recognition;
    setState('recording');
  }, [setState, setTranscript, setError]);

  const stopRealtime = useCallback(() => {
    recognitionRef.current?.stop();
    setState('stopped');
  }, [setState]);

  const polishTranscript = useCallback(async () => {
    if (!transcript.trim()) return;
    setState('polishing');

    try {
      let accumulated = '';
      await fetchStream(
        '/ai/transcribe',
        { text: transcript.replace(/\[.*?\]/g, '').trim(), mode: 'polish' },
        (chunk) => { accumulated += chunk; },
      );
      setState('done');
      onTranscribed(accumulated);
      toast({ title: 'Voice post ready!', description: 'Transcription added to editor.', variant: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
    }
  }, [transcript, setState, setError, onTranscribed]);

  const handleFileUpload = useCallback(async (file: File) => {
    setState('transcribing');

    try {
      const formData = new FormData();
      formData.append('audio', file);

      let accumulated = '';
      const token = localStorage.getItem('speakle_token');
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? 'Transcription failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      setState('done');
      onTranscribed(accumulated);
      toast({ title: 'Audio transcribed!', description: 'Content added to editor.', variant: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  }, [setState, setError, onTranscribed]);

  const stateLabel: Record<typeof state, string> = {
    idle: 'Ready to record',
    recording: 'Recording...',
    stopped: 'Recording stopped',
    transcribing: 'Transcribing audio...',
    polishing: 'AI polishing...',
    done: 'Complete!',
    error: 'Error occurred',
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-3 text-center">
        <div className={cn(
          'mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full',
          state === 'recording' ? 'bg-red-100 animate-pulse' : 'bg-primary/10',
        )}>
          {state === 'recording' ? (
            <MicOff className="h-6 w-6 text-red-500" />
          ) : state === 'done' ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <Mic className="h-6 w-6 text-primary" />
          )}
        </div>
        <p className="text-sm font-medium">{stateLabel[state]}</p>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>

      {transcript && (
        <div className="max-h-32 overflow-y-auto rounded border bg-background p-2">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{transcript}</p>
        </div>
      )}

      <div className="flex gap-2">
        {state === 'idle' && (
          <>
            <Button onClick={startRealtime} className="flex-1" size="sm">
              <Mic className="h-4 w-4" />
              Start Recording
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="Upload audio file"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file);
              }}
            />
          </>
        )}

        {state === 'recording' && (
          <Button variant="destructive" onClick={stopRealtime} className="flex-1" size="sm">
            <MicOff className="h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {state === 'stopped' && (
          <>
            <Button onClick={() => void polishTranscript()} className="flex-1" size="sm">
              <Loader2 className="h-4 w-4" />
              Polish with AI
            </Button>
            <Button variant="outline" onClick={reset} size="sm">
              Reset
            </Button>
          </>
        )}

        {(state === 'transcribing' || state === 'polishing') && (
          <Button disabled className="flex-1" size="sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {state === 'transcribing' ? 'Transcribing...' : 'Polishing...'}
          </Button>
        )}

        {(state === 'done' || state === 'error') && (
          <Button variant="outline" onClick={reset} className="flex-1" size="sm">
            Record Again
          </Button>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}
