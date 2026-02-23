'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type VoiceConnectionState = 'disconnected' | 'connecting' | 'connected';
type VoiceStatus =
  | 'idle'
  | 'listening'
  | 'recording'
  | 'transcribing'
  | 'generating_response'
  | 'synthesizing_audio'
  | 'processing'
  | 'error';

type VoiceServerMessage = {
  type: string;
  message?: string;
  text?: string;
};

type UseVoiceSessionOptions = {
  sessionId: string | null;
  accessToken: string | null;
  enabled?: boolean;
  onTranscript?: (text: string) => void;
  onAssistantText?: (text: string) => void;
  onResponseComplete?: () => void;
  onError?: (error: string) => void;
};

type UseVoiceSessionResult = {
  isSupported: boolean;
  connectionState: VoiceConnectionState;
  status: VoiceStatus;
  isRecording: boolean;
  isPlayingAudio: boolean;
  isAudioPaused: boolean;
  lastTranscript: string;
  lastAssistantText: string;
  lastError: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => Promise<void>;
  toggleAudioPlayback: () => void;
};

const VOICE_CHUNK_MS = 250;

const getVoiceWsUrl = (sessionId: string, accessToken: string): string => {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  const httpUrl = new URL(apiBase);
  const wsProtocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsBase = `${wsProtocol}//${httpUrl.host}`;
  const wsUrl = new URL('/ws/voice', wsBase);
  wsUrl.searchParams.set('sessionId', sessionId);
  wsUrl.searchParams.set('token', accessToken);
  return wsUrl.toString();
};

export const useVoiceSession = ({
  sessionId,
  accessToken,
  enabled = true,
  onTranscript,
  onAssistantText,
  onResponseComplete,
  onError,
}: UseVoiceSessionOptions): UseVoiceSessionResult => {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const shouldSendAudioEndRef = useRef(false);
  const audioQueueRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  const manualAudioPauseRef = useRef(false);
  const callbacksRef = useRef({
    onTranscript,
    onAssistantText,
    onResponseComplete,
    onError,
  });

  const [connectionState, setConnectionState] =
    useState<VoiceConnectionState>('disconnected');
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastAssistantText, setLastAssistantText] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hasWebSocket = typeof WebSocket !== 'undefined';
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
    const hasMediaDevices =
      typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
    return hasWebSocket && hasMediaRecorder && hasMediaDevices;
  }, []);

  useEffect(() => {
    callbacksRef.current = {
      onTranscript,
      onAssistantText,
      onResponseComplete,
      onError,
    };
  }, [onAssistantText, onError, onResponseComplete, onTranscript]);

  const clearAudioPlayback = useCallback(() => {
    const currentAudio = audioElRef.current;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      audioElRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    isPlayingRef.current = false;
    manualAudioPauseRef.current = false;
    setIsPlayingAudio(false);
    setIsAudioPaused(false);
    audioQueueRef.current = [];
  }, []);

  const playNextAudio = useCallback(() => {
    if (isPlayingRef.current || manualAudioPauseRef.current) return;

    const nextChunk = audioQueueRef.current.shift();
    if (!nextChunk) {
      setIsPlayingAudio(false);
      return;
    }

    const url = URL.createObjectURL(nextChunk);
    const audio = new Audio(url);
    audioUrlRef.current = url;
    audioElRef.current = audio;
    isPlayingRef.current = true;
    setIsPlayingAudio(true);
    setIsAudioPaused(false);

    const finalize = () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      audioElRef.current = null;
      isPlayingRef.current = false;
      playNextAudio();
    };

    audio.onended = finalize;
    audio.onerror = () => {
      setLastError('Could not play assistant audio response.');
      callbacksRef.current.onError?.('Could not play assistant audio response.');
      finalize();
    };

    void audio.play().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Audio playback blocked';
      setLastError(message);
      callbacksRef.current.onError?.(message);
      finalize();
    });
  }, []);

  const pauseAudioPlayback = useCallback(() => {
    manualAudioPauseRef.current = true;
    const audio = audioElRef.current;
    if (audio && !audio.paused) {
      audio.pause();
    }
    setIsAudioPaused(true);
    setIsPlayingAudio(false);
  }, []);

  const resumeAudioPlayback = useCallback(() => {
    manualAudioPauseRef.current = false;
    const audio = audioElRef.current;

    if (audio && audio.paused) {
      void audio.play().then(() => {
        setIsAudioPaused(false);
        setIsPlayingAudio(true);
      }).catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Could not resume audio playback.';
        setLastError(message);
        callbacksRef.current.onError?.(message);
      });
      return;
    }

    setIsAudioPaused(false);
    playNextAudio();
  }, [playNextAudio]);

  const stopActiveMediaRecorder = useCallback((sendAudioEnd: boolean) => {
    shouldSendAudioEndRef.current = sendAudioEnd;

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      shouldSendAudioEndRef.current = false;
    }
  }, []);

  const releaseMediaStream = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId || !accessToken || !isSupported) {
      wsRef.current?.close();
      wsRef.current = null;
      stopActiveMediaRecorder(false);
      releaseMediaStream();
      clearAudioPlayback();
      setIsRecording(false);
      setConnectionState('disconnected');
      setStatus('idle');
      return;
    }

    const ws = new WebSocket(getVoiceWsUrl(sessionId, accessToken));
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;
    setConnectionState('connecting');
    setLastError(null);
    setIsAudioPaused(false);

    ws.onopen = () => {
      setConnectionState('connected');
      setStatus('idle');
      setLastError(null);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        let parsed: VoiceServerMessage | null = null;

        try {
          parsed = JSON.parse(event.data) as VoiceServerMessage;
        } catch {
          return;
        }

        if (!parsed) return;

        if (parsed.type === 'status' && parsed.message) {
          const message = parsed.message as VoiceStatus | 'empty_transcript';
          setStatus(message === 'empty_transcript' ? 'idle' : message);
          return;
        }

        if (parsed.type === 'transcript') {
          const text = parsed.text || '';
          setLastTranscript(text);
          callbacksRef.current.onTranscript?.(text);
          return;
        }

        if (parsed.type === 'assistant_text') {
          const text = parsed.text || '';
          setLastAssistantText(text);
          callbacksRef.current.onAssistantText?.(text);
          return;
        }

        if (parsed.type === 'response_complete') {
          setStatus('idle');
          callbacksRef.current.onResponseComplete?.();
          return;
        }

        if (parsed.type === 'error') {
          const message = parsed.message || 'Voice processing failed';
          setStatus('error');
          setLastError(message);
          callbacksRef.current.onError?.(message);
        }

        return;
      }

      const audioBlob =
        event.data instanceof ArrayBuffer
          ? new Blob([event.data], { type: 'audio/wav' })
          : event.data instanceof Blob
            ? event.data
            : null;

      if (!audioBlob) return;
      audioQueueRef.current.push(audioBlob);
      playNextAudio();
    };

    ws.onerror = () => {
      const message = 'Voice WebSocket connection error.';
      setLastError(message);
      callbacksRef.current.onError?.(message);
    };

    ws.onclose = () => {
      setConnectionState('disconnected');
      setStatus('idle');
      setIsRecording(false);
      stopActiveMediaRecorder(false);
      releaseMediaStream();
    };

    return () => {
      ws.close();
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      stopActiveMediaRecorder(false);
      releaseMediaStream();
      clearAudioPlayback();
      setIsRecording(false);
      setConnectionState('disconnected');
      setStatus('idle');
    };
  }, [
    accessToken,
    clearAudioPlayback,
    enabled,
    isSupported,
    playNextAudio,
    releaseMediaStream,
    sessionId,
    stopActiveMediaRecorder,
  ]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const message = 'Voice is not supported in this browser.';
      setLastError(message);
      callbacksRef.current.onError?.(message);
      return;
    }

    if (!sessionId) {
      const message = 'Start a session before starting voice streaming.';
      setLastError(message);
      callbacksRef.current.onError?.(message);
      return;
    }

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      const message = 'Voice channel is not connected yet.';
      setLastError(message);
      callbacksRef.current.onError?.(message);
      return;
    }

    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      const supportedMime = mimeCandidates.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );

      const mediaRecorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      shouldSendAudioEndRef.current = true;

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'audio_start',
            mimeType: mediaRecorder.mimeType || supportedMime || 'audio/webm',
          }),
        );
      }

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (!event.data || event.data.size <= 0) return;
        const socket = wsRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(event.data);
      };

      mediaRecorder.onerror = () => {
        const message = 'Microphone streaming error.';
        setLastError(message);
        callbacksRef.current.onError?.(message);
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        if (shouldSendAudioEndRef.current) {
          setStatus('processing');
        }

        const socket = wsRef.current;
        if (shouldSendAudioEndRef.current && socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'audio_end' }));
        }

        shouldSendAudioEndRef.current = false;
        releaseMediaStream();
      };

      mediaRecorder.start(VOICE_CHUNK_MS);
      setLastError(null);
      setIsRecording(true);
      setStatus('recording');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not access microphone.';
      setLastError(message);
      callbacksRef.current.onError?.(message);
      setIsRecording(false);
    }
  }, [isRecording, isSupported, releaseMediaStream, sessionId]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    stopActiveMediaRecorder(true);
  }, [isRecording, stopActiveMediaRecorder]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    await startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const toggleAudioPlayback = useCallback(() => {
    if (isAudioPaused) {
      resumeAudioPlayback();
      return;
    }

    if (isPlayingRef.current || audioElRef.current) {
      pauseAudioPlayback();
      return;
    }

    resumeAudioPlayback();
  }, [isAudioPaused, pauseAudioPlayback, resumeAudioPlayback]);

  return {
    isSupported,
    connectionState,
    status,
    isRecording,
    isPlayingAudio,
    isAudioPaused,
    lastTranscript,
    lastAssistantText,
    lastError,
    startRecording,
    stopRecording,
    toggleRecording,
    toggleAudioPlayback,
  };
};
