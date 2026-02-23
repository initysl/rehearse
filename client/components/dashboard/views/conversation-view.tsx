'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SessionMessage } from '@/lib/api/types';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMic, FiMicOff, FiPause, FiPlay } from 'react-icons/fi';
import { Panel } from '../panel';

type ConversationViewProps = {
  activeSessionId: string | null;
  messages: SessionMessage[];
  voiceSupported: boolean;
  voiceConnectionState: 'disconnected' | 'connecting' | 'connected';
  voiceStatus: string;
  isRecording: boolean;
  isPlayingAudio: boolean;
  isAudioPaused: boolean;
  voiceTranscript: string;
  voiceAssistantText: string;
  voiceErrorMessage?: string;
  aiCharacterName?: string;
  onToggleRecording: () => void | Promise<void>;
  onToggleAudioPlayback: () => void;
};

function StageWave() {
  return (
    <div className='relative flex h-70 w-70 items-center justify-center rounded-full border border-dashed border-[#6d79ad]/60 md:h-85 md:w-85'>
      <motion.div
        className='absolute h-[72%] w-[72%] rounded-full border border-[#9fb1ff]/35'
        animate={{ scale: [1, 1.07, 1], opacity: [0.55, 0.95, 0.55] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className='absolute h-[54%] w-[54%] rounded-full border border-[#6f84d8]/45'
        animate={{ scale: [1.02, 0.96, 1.02], opacity: [0.8, 0.45, 0.8] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className='h-[36%] w-[36%] rounded-full bg-radial from-[#8fa4ff]/70 via-[#5871d0]/40 to-transparent'
        animate={{ scale: [0.95, 1.1, 0.95] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function TinyWaveBars() {
  return (
    <div className='inline-flex items-end gap-1'>
      {Array.from({ length: 5 }).map((_, idx) => (
        <motion.span
          key={idx}
          className='h-2 w-1 rounded-full bg-[#8ea2f7]'
          animate={{ scaleY: [0.45, 1.2, 0.55, 1] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: idx * 0.08,
          }}
          style={{ transformOrigin: 'bottom center' }}
        />
      ))}
    </div>
  );
}

type TranscriptRow = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export function ConversationView({
  activeSessionId,
  messages,
  voiceSupported,
  voiceConnectionState,
  voiceStatus,
  isRecording,
  isPlayingAudio,
  isAudioPaused,
  voiceTranscript,
  voiceAssistantText,
  voiceErrorMessage,
  aiCharacterName = 'AI Character',
  onToggleRecording,
  onToggleAudioPlayback,
}: ConversationViewProps) {
  const [spokenWords, setSpokenWords] = useState<string[]>([]);
  const transcriptScrollerRef = useRef<HTMLDivElement | null>(null);

  const isAiSpeaking = useMemo(
    () =>
      (isPlayingAudio && !isAudioPaused) ||
      voiceStatus === 'synthesizing_audio' ||
      voiceStatus === 'generating_response',
    [isAudioPaused, isPlayingAudio, voiceStatus],
  );

  const transcriptRows = useMemo<TranscriptRow[]>(() => {
    return messages
      .filter(
        (message) => message.role === 'user' || message.role === 'assistant',
      )
      .map((message) => ({
        id: message.id,
        role: message.role as 'user' | 'assistant',
        text: message.content,
      }));
  }, [messages]);

  useEffect(() => {
    if (!voiceAssistantText.trim()) {
      setSpokenWords([]);
      return;
    }

    const words = voiceAssistantText.trim().split(/\s+/);
    setSpokenWords([]);
    let cursor = 0;

    const timer = window.setInterval(() => {
      cursor += 1;
      setSpokenWords(words.slice(0, cursor));
      if (cursor >= words.length) {
        window.clearInterval(timer);
      }
    }, 65);

    return () => {
      window.clearInterval(timer);
    };
  }, [voiceAssistantText]);

  useEffect(() => {
    const node = transcriptScrollerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [transcriptRows, voiceTranscript, voiceAssistantText]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      const target = event.target as HTMLElement | null;
      const isTypingTarget = Boolean(
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable),
      );
      if (isTypingTarget || !activeSessionId || isAiSpeaking) return;
      event.preventDefault();
      void onToggleRecording();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSessionId, isAiSpeaking, onToggleRecording]);

  const aiSpeakingText = spokenWords.join(' ');
  const micDisabled =
    !voiceSupported ||
    !activeSessionId ||
    (voiceConnectionState !== 'connected' && !isRecording) ||
    isAiSpeaking;
  const canTogglePlayback = isPlayingAudio || isAudioPaused;

  return (
    <Panel
      title='Voice Conversation'
      description='Unified voice-first workspace with live transcript stream.'
      className='overflow-hidden'
      rightSlot={
        <span className='rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/60'>
          {activeSessionId ? 'Session live' : 'No active session'}
        </span>
      }
    >
      <div className='grid gap-4 lg:grid-cols-[1.05fr_0.95fr]'>
        <section className='rounded-2xl border border-white/12 bg-white/3 p-4 backdrop-blur-xl'>
          <div className='flex flex-col items-center justify-center'>
            <StageWave />

            {aiSpeakingText ? (
              <div className='mt-4 w-full max-w-105'>
                <p className='mb-1 text-[10px] uppercase tracking-[0.13em] text-white/35'>
                  {aiCharacterName}
                </p>
                <div className='rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90'>
                  <AnimatePresence initial={false}>
                    {spokenWords.map((word, index) => (
                      <motion.span
                        key={`${word}-${index}`}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                        className='mr-1 inline-block'
                      >
                        {word}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : null}
          </div>

          <div className='mt-5 flex flex-wrap items-center gap-2'>
            <button
              type='button'
              onClick={() => {
                void onToggleRecording();
              }}
              disabled={micDisabled}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                isRecording
                  ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                  : 'border border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
              } ${isAiSpeaking ? 'animate-pulse opacity-50 shadow-[0_0_20px_rgba(44,63,128,0.45)]' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {isRecording ? <FiMicOff size={13} /> : <FiMic size={13} />}
              {isAiSpeaking
                ? 'AI speaking'
                : isRecording
                  ? 'Pause mic'
                  : 'Start mic'}
            </button>

            <button
              type='button'
              onClick={onToggleAudioPlayback}
              disabled={!canTogglePlayback}
              className='inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isAudioPaused ? <FiPlay size={13} /> : <FiPause size={13} />}
              {isAudioPaused ? 'Resume voice' : 'Pause voice'}
            </button>

            {isAiSpeaking ? (
              <div className='ml-1 rounded-lg border border-[#7a8bb8]/25 bg-[#27314e]/25 px-2 py-1'>
                <TinyWaveBars />
              </div>
            ) : null}
          </div>

          <p className='mt-3 text-xs text-white/40'>
            {voiceSupported
              ? `Connection: ${voiceConnectionState} · State: ${voiceStatus} · Space toggles mic`
              : 'This browser does not support microphone streaming.'}
          </p>
        </section>

        <section className='rounded-2xl border border-white/10 bg-white/2 p-4 backdrop-blur-2xl'>
          <div className='mb-3 flex items-center justify-between'>
            <p className='text-xs font-semibold uppercase tracking-[0.12em] text-white/55'>
              Transcript Stream
            </p>
            <span className='rounded-full border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/45'>
              Voice only
            </span>
          </div>

          <div
            ref={transcriptScrollerRef}
            className='h-107.5 space-y-2 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin]'
          >
            {transcriptRows.length === 0 ? (
              <p className='rounded-xl border border-white/12 bg-white/2 px-3 py-2 text-sm text-white/45'>
                Start talking. User and AI transcripts will appear here.
              </p>
            ) : null}

            {transcriptRows.map((row) => (
              <div
                key={row.id}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  row.role === 'user'
                    ? 'ml-auto max-w-[90%] border-cyan-300/20 bg-cyan-300/8 text-cyan-100'
                    : 'max-w-[90%] border-white/15 bg-white/5 text-white/85'
                }`}
              >
                <p className='mb-1 text-[10px] uppercase tracking-[0.12em] text-white/40'>
                  {row.role === 'assistant' ? aiCharacterName : 'You'}
                </p>
                {row.text}
              </div>
            ))}

            {voiceTranscript ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className='ml-auto max-w-[90%] rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100'
              >
                <p className='mb-1 text-[10px] uppercase tracking-[0.12em] text-cyan-100/70'>
                  You · live
                </p>
                {voiceTranscript}
              </motion.div>
            ) : null}

            {voiceAssistantText && isAiSpeaking ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className='max-w-[90%] rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90'
              >
                <p className='mb-1 text-[10px] uppercase tracking-[0.12em] text-white/45'>
                  {aiCharacterName} · streaming
                </p>
                {voiceAssistantText}
              </motion.div>
            ) : null}
          </div>
        </section>
      </div>

      {voiceErrorMessage ? (
        <p className='mt-3 text-xs text-rose-300'>{voiceErrorMessage}</p>
      ) : null}
    </Panel>
  );
}
