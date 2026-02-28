'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SessionMessage } from '@/lib/api/types';
import { motion } from 'framer-motion';
import { FiArrowUp, FiMic, FiMicOff, FiPause, FiPlay } from 'react-icons/fi';
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
  textErrorMessage?: string;
  pendingTextUser: string;
  textStreamingAssistant: string;
  isSendingText: boolean;
  aiCharacterName?: string;
  onToggleRecording: () => void | Promise<void>;
  onToggleAudioPlayback: () => void;
  onSendTextMessage: (content: string) => Promise<void>;
};

function TinyWaveBars() {
  return (
    <div className='inline-flex items-end gap-1'>
      {Array.from({ length: 5 }).map((_, idx) => (
        <motion.span
          key={idx}
          className='h-2 w-1 rounded-full bg-amber-500'
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

const normalizeText = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

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
  textErrorMessage,
  pendingTextUser,
  textStreamingAssistant,
  isSendingText,
  aiCharacterName = 'AI Character',
  onToggleRecording,
  onToggleAudioPlayback,
  onSendTextMessage,
}: ConversationViewProps) {
  const [textInput, setTextInput] = useState('');
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
        (message): message is SessionMessage & { role: 'user' | 'assistant' } =>
          message.role === 'user' || message.role === 'assistant',
      )
      .map((message) => ({
        id: message.id,
        role: message.role,
        text: message.content,
      }));
  }, [messages]);

  const lastPersistedUserText = useMemo(() => {
    for (let index = transcriptRows.length - 1; index >= 0; index -= 1) {
      if (transcriptRows[index].role === 'user') {
        return transcriptRows[index].text;
      }
    }
    return '';
  }, [transcriptRows]);

  const lastPersistedAssistantText = useMemo(() => {
    for (let index = transcriptRows.length - 1; index >= 0; index -= 1) {
      if (transcriptRows[index].role === 'assistant') {
        return transcriptRows[index].text;
      }
    }
    return '';
  }, [transcriptRows]);

  const shouldShowLiveUserTranscript = useMemo(() => {
    if (!voiceTranscript.trim()) return false;
    return (
      normalizeText(voiceTranscript) !== normalizeText(lastPersistedUserText)
    );
  }, [lastPersistedUserText, voiceTranscript]);

  const shouldShowLiveAssistantTranscript = useMemo(() => {
    if (!voiceAssistantText.trim() || !isAiSpeaking) return false;
    return (
      normalizeText(voiceAssistantText) !==
      normalizeText(lastPersistedAssistantText)
    );
  }, [isAiSpeaking, lastPersistedAssistantText, voiceAssistantText]);

  const shouldShowPendingTextUser = useMemo(() => {
    if (!pendingTextUser.trim()) return false;
    return (
      normalizeText(pendingTextUser) !== normalizeText(lastPersistedUserText)
    );
  }, [lastPersistedUserText, pendingTextUser]);

  const shouldShowStreamingTextAssistant = useMemo(() => {
    if (!textStreamingAssistant.trim()) return false;
    return (
      normalizeText(textStreamingAssistant) !==
      normalizeText(lastPersistedAssistantText)
    );
  }, [lastPersistedAssistantText, textStreamingAssistant]);

  useEffect(() => {
    const node = transcriptScrollerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [
    transcriptRows,
    voiceTranscript,
    voiceAssistantText,
    pendingTextUser,
    textStreamingAssistant,
  ]);

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

  const micDisabled =
    !voiceSupported ||
    !activeSessionId ||
    (voiceConnectionState !== 'connected' && !isRecording) ||
    isAiSpeaking;
  const canTogglePlayback = isPlayingAudio || isAudioPaused;
  const textDisabled =
    !activeSessionId ||
    isSendingText ||
    isAiSpeaking ||
    voiceStatus === 'processing' ||
    voiceStatus === 'transcribing';

  const handleSendText = async () => {
    const content = textInput.trim();
    if (!content || textDisabled) return;
    await onSendTextMessage(content);
    setTextInput('');
  };

  return (
    <div>
      <div>
        <section className='rounded-2xl border border-white/10 bg-white/2 p-4 backdrop-blur-2xl'>
          <div className='mb-3 flex items-center justify-between'>
            <p className='text-xs font-semibold uppercase tracking-[0.12em] text-white/55'>
              Transcript Stream
            </p>
            <span className='rounded-full border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/45'>
              Chat + voice
            </span>
          </div>

          <div
            ref={transcriptScrollerRef}
            className='h-90 space-y-2 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin] md:h-[300px]'
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

            {shouldShowLiveUserTranscript ? (
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

            {shouldShowLiveAssistantTranscript ? (
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

            {shouldShowPendingTextUser ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className='ml-auto max-w-[90%] rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100'
              >
                <p className='mb-1 text-[10px] uppercase tracking-[0.12em] text-cyan-100/70'>
                  You · sending
                </p>
                {pendingTextUser}
              </motion.div>
            ) : null}

            {shouldShowStreamingTextAssistant ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className='max-w-[90%] rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90'
              >
                <p className='mb-1 text-[10px] uppercase tracking-[0.12em] text-white/45'>
                  {aiCharacterName} · typing
                </p>
                {textStreamingAssistant}
              </motion.div>
            ) : null}
          </div>

          <div className='mt-4 rounded-[22px] border border-amber-300/20 bg-[#191207]/90 p-2.5 shadow-[0_24px_70px_-40px_rgba(245,158,11,0.65)] backdrop-blur-xl'>
            <div className='rounded-[14px] bg-amber-500/10 px-3 py-2.5'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='inline-flex items-center gap-2 text-xs text-amber-100/80'>
                  <span className='h-2 w-2 rounded-full bg-amber-400/90' />
                  {isSendingText ? 'Thinking...' : 'Message'}
                </div>
                <span className='rounded-md border border-amber-300/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-100/75'>
                  {isSendingText ? 'Streaming' : 'Live'}
                </span>
              </div>

              <textarea
                value={textInput}
                onChange={(event) => setTextInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendText();
                  }
                }}
                rows={1}
                placeholder={
                  activeSessionId
                    ? 'Type your message...'
                    : 'Start a session to begin text chat'
                }
                disabled={textDisabled}
                className='w-full resize-none bg-transparent px-0 py-0 text-sm text-amber-50 outline-none placeholder:text-amber-100/35 disabled:cursor-not-allowed disabled:opacity-60'
              />
            </div>

            <div className='mt-2 flex items-center justify-between gap-2 pl-1'>
              <div className='flex items-center text-amber-100/70'>
                <span className='ml-1 rounded-md border border-amber-300/20 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-100/70'>
                  Enter send · Shift+Enter newline
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => {
                    void onToggleRecording();
                  }}
                  disabled={micDisabled}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-55 ${
                    isRecording
                      ? 'border-rose-300/40 bg-rose-500/20 text-rose-100 shadow-[0_12px_26px_-16px_rgba(244,63,94,0.85)]'
                      : 'border-amber-200/40 bg-amber-500/12 text-amber-100 shadow-[0_12px_26px_-16px_rgba(245,158,11,0.75)]'
                  } ${isAiSpeaking ? 'animate-pulse' : 'hover:scale-[1.03] hover:brightness-105'}`}
                  aria-label={
                    isAiSpeaking
                      ? 'AI speaking'
                      : isRecording
                        ? 'Pause mic'
                        : 'Start mic'
                  }
                  title={
                    isAiSpeaking
                      ? 'AI speaking'
                      : isRecording
                        ? 'Pause mic'
                        : 'Start mic'
                  }
                >
                  {isRecording ? <FiMicOff size={17} /> : <FiMic size={17} />}
                </button>

                <button
                  type='button'
                  onClick={onToggleAudioPlayback}
                  disabled={!canTogglePlayback}
                  className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200/40 bg-amber-500/10 text-amber-100 transition hover:scale-[1.03] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55'
                  aria-label={isAudioPaused ? 'Resume voice' : 'Pause voice'}
                  title={isAudioPaused ? 'Resume voice' : 'Pause voice'}
                >
                  {isAudioPaused ? <FiPlay size={16} /> : <FiPause size={16} />}
                </button>

                <button
                  type='button'
                  onClick={() => {
                    void handleSendText();
                  }}
                  disabled={textDisabled || !textInput.trim()}
                  className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200/40 bg-linear-to-r from-amber-400 to-orange-500 text-[#201007] shadow-[0_12px_26px_-16px_rgba(245,158,11,0.9)] transition hover:scale-[1.03] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55'
                  aria-label={isSendingText ? 'Sending' : 'Send message'}
                >
                  <FiArrowUp size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className='mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-[11px] text-white/60'>
            <span className='rounded-md border border-white/12 bg-white/4 px-2 py-1'>
              Voice: {voiceSupported ? 'Supported' : 'Unavailable'}
            </span>
            <span className='rounded-md border border-white/12 bg-white/4 px-2 py-1'>
              Connection: {voiceConnectionState}
            </span>
            <span className='rounded-md border border-white/12 bg-white/4 px-2 py-1'>
              State: {voiceStatus}
            </span>
            {isAiSpeaking ? (
              <span className='inline-flex items-center gap-2 rounded-md border border-amber-300/25 bg-amber-500/10 px-2 py-1 text-amber-200'>
                <TinyWaveBars />
                AI speaking
              </span>
            ) : null}
          </div>
        </section>
      </div>

      {voiceErrorMessage ? (
        <p className='mt-3 text-xs text-rose-300'>{voiceErrorMessage}</p>
      ) : null}
      {textErrorMessage ? (
        <p className='mt-2 text-xs text-rose-300'>{textErrorMessage}</p>
      ) : null}
    </div>
  );
}
