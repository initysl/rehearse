import { WebSocket } from "ws";
import { transcribeAudio } from "./stt.service";
import { streamTTS } from "./audio.pipeline";
import { generateSessionReplyText } from "../modules/messages/messages.service";
import { logError, logInfo, logWarn } from "../utils/logger";
import {
  toSafeVoiceProcessingMessage,
  toSafeVoiceUnavailableReason,
} from "../utils/public-error";

const MAX_AUDIO_BYTES_PER_TURN = 2 * 1024 * 1024;
const MAX_AUDIO_CHUNKS_PER_TURN = 200;
const MAX_MALFORMED_MESSAGES = 5;
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/mp4",
  "audio/m4a",
]);

export const handleVoiceSession = (
  ws: WebSocket,
  context: { sessionId: string; userId: string }
) => {
  const audioChunks: Buffer[] = [];
  let audioMimeType = "audio/webm";
  let bufferedAudioBytes = 0;
  let isAwaitingAudio = false;
  let isProcessingTurn = false;
  let malformedMessages = 0;

  const resetTurnBuffer = () => {
    audioChunks.length = 0;
    bufferedAudioBytes = 0;
  };

  const parseSocketMessage = (raw: Buffer): { type?: string; [key: string]: unknown } | null => {
    try {
      const parsed = JSON.parse(raw.toString()) as unknown;
      if (!parsed || typeof parsed !== "object") return null;
      return parsed as { type?: string; [key: string]: unknown };
    } catch {
      return null;
    }
  };

  ws.on("message", async (data: Buffer, isBinary: boolean) => {
    try {
      if (isBinary) {
        if (!isAwaitingAudio || isProcessingTurn) {
          return;
        }

        if (!Buffer.isBuffer(data) || data.length === 0) {
          return;
        }

        if (audioChunks.length >= MAX_AUDIO_CHUNKS_PER_TURN) {
          resetTurnBuffer();
          isAwaitingAudio = false;
          ws.send(
            JSON.stringify({
              type: "error",
              code: "VOICE_PROCESSING_FAILED",
              message: "Audio input exceeded chunk limit. Please retry with a shorter message.",
            })
          );
          ws.send(JSON.stringify({ type: "status", message: "idle" }));
          return;
        }

        bufferedAudioBytes += data.length;
        if (bufferedAudioBytes > MAX_AUDIO_BYTES_PER_TURN) {
          resetTurnBuffer();
          isAwaitingAudio = false;
          ws.send(
            JSON.stringify({
              type: "error",
              code: "VOICE_PROCESSING_FAILED",
              message: "Audio input is too large. Please keep each turn shorter.",
            })
          );
          ws.send(JSON.stringify({ type: "status", message: "idle" }));
          return;
        }

        audioChunks.push(data);
        return;
      }

      const message = parseSocketMessage(data);
      if (!message || typeof message.type !== "string") {
        malformedMessages += 1;
        if (malformedMessages >= MAX_MALFORMED_MESSAGES) {
          ws.close(1008, "Too many malformed messages");
          return;
        }
        ws.send(
          JSON.stringify({
            type: "error",
            code: "VOICE_PROCESSING_FAILED",
            message: "Malformed websocket message",
          })
        );
        return;
      }
      malformedMessages = 0;

      if (message.type === "audio_start") {
        if (isProcessingTurn) {
          ws.send(
            JSON.stringify({
              type: "status",
              message: "processing",
            })
          );
          return;
        }

        resetTurnBuffer();
        isAwaitingAudio = true;
        const incomingMimeType =
          typeof message.mimeType === "string" ? message.mimeType : "";

        if (ALLOWED_AUDIO_MIME_TYPES.has(incomingMimeType.toLowerCase())) {
          audioMimeType = incomingMimeType;
        } else {
          audioMimeType = "audio/webm";
        }

        ws.send(
          JSON.stringify({
            type: "status",
            message: "listening",
          })
        );
        return;
      }

      if (message.type === "audio_end") {
        if (!isAwaitingAudio) {
          ws.send(
            JSON.stringify({
              type: "error",
              code: "VOICE_PROCESSING_FAILED",
              message: "audio_end received before audio_start",
            })
          );
          return;
        }

        isAwaitingAudio = false;
        if (audioChunks.length === 0) {
          ws.send(
            JSON.stringify({
              type: "error",
              code: "NO_AUDIO_RECEIVED",
              message: "No audio received",
            })
          );
          resetTurnBuffer();
          return;
        }

        isProcessingTurn = true;
        try {
          // User stopped speaking — process the audio
          const audioBuffer = Buffer.concat(audioChunks);
          resetTurnBuffer();
          logInfo("voice.ws.audio_received", {
            sessionId: context.sessionId,
            userId: context.userId,
            mimeType: audioMimeType,
            bytes: audioBuffer.length,
          });

          ws.send(JSON.stringify({ type: "status", message: "transcribing" }));
          const sttStartedAt = Date.now();
          const transcript = await transcribeAudio(audioBuffer, audioMimeType);
          const sttLatencyMs = Date.now() - sttStartedAt;
          if (!transcript.trim()) {
            logInfo("voice.ws.transcribe_empty", {
              sessionId: context.sessionId,
              userId: context.userId,
              sttLatencyMs,
            });
            ws.send(JSON.stringify({ type: "status", message: "empty_transcript" }));
            return;
          }
          logInfo("voice.ws.transcribe_done", {
            sessionId: context.sessionId,
            userId: context.userId,
            sttLatencyMs,
            transcriptChars: transcript.length,
          });

          ws.send(JSON.stringify({ type: "transcript", text: transcript }));
          ws.send(JSON.stringify({ type: "status", message: "generating_response" }));
          const responseStartedAt = Date.now();
          const generated = await generateSessionReplyText({
            userId: context.userId,
            sessionId: context.sessionId,
            userContent: transcript,
          });
          const generationLatencyMs = Date.now() - responseStartedAt;
          logInfo("voice.ws.reply_generated", {
            sessionId: context.sessionId,
            userId: context.userId,
            generationLatencyMs,
            assistantChars: generated.assistantContent.length,
          });

          ws.send(
            JSON.stringify({ type: "assistant_text", text: generated.assistantContent })
          );

          ws.send(JSON.stringify({ type: "status", message: "synthesizing_audio" }));
          const ttsStartedAt = Date.now();
          try {
            await streamTTS(
              generated.assistantContent,
              context.sessionId,
              context.userId,
              ws
            );
            logInfo("voice.ws.tts_done", {
              sessionId: context.sessionId,
              userId: context.userId,
              ttsLatencyMs: Date.now() - ttsStartedAt,
            });
          } catch (ttsError) {
            const ttsMessage = (ttsError as Error).message || "Unknown TTS failure";
            const safeReason = toSafeVoiceUnavailableReason(ttsMessage);
            logWarn("voice.ws.tts_unavailable", {
              sessionId: context.sessionId,
              userId: context.userId,
              error: ttsMessage,
              ttsLatencyMs: Date.now() - ttsStartedAt,
            });
            ws.send(
              JSON.stringify({
                type: "status",
                message: "audio_unavailable",
                code: safeReason.code,
                reason: safeReason.message,
              })
            );
            ws.send(JSON.stringify({ type: "response_complete" }));
          }
          ws.send(JSON.stringify({ type: "status", message: "idle" }));
          return;
        } finally {
          isProcessingTurn = false;
          audioMimeType = "audio/webm";
        }
      }

      ws.send(
        JSON.stringify({
          type: "error",
          code: "VOICE_PROCESSING_FAILED",
          message: "Unsupported websocket event type",
        })
      );
    } catch (err) {
      isAwaitingAudio = false;
      isProcessingTurn = false;
      resetTurnBuffer();
      const internalMessage = (err as Error).message || "Voice processing failed";
      const safeMessage = toSafeVoiceProcessingMessage();
      logError("voice.ws.processing_failed", {
        sessionId: context.sessionId,
        userId: context.userId,
        error: internalMessage,
      });
      ws.send(
        JSON.stringify({
          type: "error",
          code: safeMessage.code,
          message: safeMessage.message,
        })
      );
    }
  });

  ws.on("close", () => {
    logInfo("voice.ws.closed", {
      sessionId: context.sessionId,
      userId: context.userId,
    });
  });

  ws.on("error", (error) => {
    logWarn("voice.ws.socket_error", {
      sessionId: context.sessionId,
      userId: context.userId,
      error: (error as Error).message,
    });
  });
};
