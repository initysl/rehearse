'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { SessionMessage } from '@/lib/api/types';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMic, FiMicOff, FiSend } from 'react-icons/fi';
import { Panel } from '../panel';

type ConversationViewProps = {
  activeSessionId: string | null;
  messages: SessionMessage[];
  assistantStream: string;
  messageInput: string;
  isSending: boolean;
  voiceSupported: boolean;
  voiceConnectionState: 'disconnected' | 'connecting' | 'connected';
  voiceStatus: string;
  isRecording: boolean;
  isPlayingAudio: boolean;
  voiceAssistantText: string;
  voiceErrorMessage?: string;
  aiCharacterName?: string;
  onToggleRecording: () => void | Promise<void>;
  onMessageInputChange: (value: string) => void;
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void;
};

function SpeakingWaveform() {
  const bars = [0, 1, 2, 3, 4];

  return (
    <div className='inline-flex items-end gap-1'>
      {bars.map((bar) => (
        <motion.span
          key={bar}
          className='h-2 w-1 rounded-full bg-[#7a8bb8]'
          animate={{ scaleY: [0.5, 1.2, 0.55, 1] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: bar * 0.08,
          }}
          style={{ transformOrigin: 'bottom center' }}
        />
      ))}
    </div>
  );
}

export function ConversationView({
  activeSessionId,
  messages,
  assistantStream,
  messageInput,
  isSending,
  voiceSupported,
  voiceConnectionState,
  voiceStatus,
  isRecording,
  isPlayingAudio,
  voiceAssistantText,
  voiceErrorMessage,
  aiCharacterName = 'AI Character',
  onToggleRecording,
  onMessageInputChange,
  onSendMessage,
}: ConversationViewProps) {
  const [spokenWords, setSpokenWords] = useState<string[]>([]);

  const isAiSpeaking = useMemo(
    () =>
      isPlayingAudio ||
      voiceStatus === 'synthesizing_audio' ||
      voiceStatus === 'generating_response',
    [isPlayingAudio, voiceStatus],
  );

  useEffect(() => {
    if (!voiceAssistantText.trim()) {
      setSpokenWords([]);
      return;
    }

    const words = voiceAssistantText.trim().split(/\s+/);
    setSpokenWords([]);
    let wordIndex = 0;

    const timer = window.setInterval(() => {
      wordIndex += 1;
      setSpokenWords(words.slice(0, wordIndex));
      if (wordIndex >= words.length) {
        window.clearInterval(timer);
      }
    }, 70);

    return () => {
      window.clearInterval(timer);
    };
  }, [voiceAssistantText]);

  const aiSpeakingText = spokenWords.join(' ');
  const micDisabled =
    !voiceSupported ||
    !activeSessionId ||
    (voiceConnectionState !== 'connected' && !isRecording) ||
    isAiSpeaking;

  return (
    <Panel
      title='Conversation Interface'
      description='Live text and voice interaction with your AI scenario character.'
      rightSlot={
        <span className='rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/60'>
          {activeSessionId ? 'Live' : 'Idle'}
        </span>
      }
    >
      <div className='max-h-80 space-y-2 overflow-auto rounded-xl border border-white/15 bg-[#141414] p-3'>
        {messages.length ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'ml-auto border border-amber-400/25 bg-amber-400/10 text-amber-100'
                  : 'border border-white/15 bg-white/5 text-white/85'
              }`}
            >
              {message.content}
            </div>
          ))
        ) : (
          <p className='text-sm text-white/45'>
            No messages yet. Start a session and send your first message.
          </p>
        )}

        {assistantStream ? (
          <div className='max-w-[90%] rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100'>
            {assistantStream}
          </div>
        ) : null}

        {aiSpeakingText ? (
          <div className='max-w-[90%]'>
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

      <form className='mt-3 flex flex-col gap-2' onSubmit={onSendMessage}>
        <textarea
          className='min-h-24 w-full rounded-xl border border-white/15 bg-[#141414] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/45'
          placeholder='Type your next message...'
          value={messageInput}
          onChange={(event) => onMessageInputChange(event.target.value)}
        />

        <button
          type='submit'
          disabled={isSending || !activeSessionId}
          className='inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80 disabled:cursor-not-allowed disabled:opacity-60'
        >
          <FiSend size={12} />
          {isSending ? 'Sending...' : 'Send message'}
        </button>
      </form>

      <div className='mt-4 rounded-xl border border-white/15 bg-[#141414] p-3'>
        <p className='text-xs font-semibold uppercase tracking-widest text-white/55'>
          Voice Channel
        </p>

        <div className='mt-3 flex flex-col items-start gap-2'>
          {isAiSpeaking ? (
            <div className='rounded-lg border border-[#7a8bb8]/25 bg-[#27314e]/25 px-2 py-1'>
              <SpeakingWaveform />
            </div>
          ) : null}

          <button
            type='button'
            onClick={() => {
              void onToggleRecording();
            }}
            disabled={micDisabled}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
              isRecording
                ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                : 'border border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
            } ${isAiSpeaking ? 'animate-pulse opacity-50 shadow-[0_0_20px_rgba(41,60,112,0.45)]' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isRecording ? <FiMicOff size={13} /> : <FiMic size={13} />}
            {isAiSpeaking
              ? 'AI speaking...'
              : isRecording
                ? 'Finish talking'
                : 'Start talking'}
          </button>

          <p className='text-xs text-white/40'>
            {voiceSupported
              ? `Connection: ${voiceConnectionState} · State: ${voiceStatus}`
              : 'This browser does not support microphone streaming.'}
          </p>
        </div>

        {voiceErrorMessage ? (
          <p className='mt-2 text-xs text-rose-300'>{voiceErrorMessage}</p>
        ) : null}
      </div>
    </Panel>
  );
}
