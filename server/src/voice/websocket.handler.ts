import { WebSocket } from "ws";
import { transcribeAudio } from "./stt.service";
import { streamTTS } from "./audio.pipeline";
import { generateSessionReplyText } from "../modules/messages/messages.service";
import { logError, logInfo, logWarn } from "../utils/logger";

export const handleVoiceSession = (
  ws: WebSocket,
  context: { sessionId: string; userId: string }
) => {
  const audioChunks: Buffer[] = [];
  let audioMimeType = "audio/webm";

  ws.on("message", async (data: Buffer, isBinary: boolean) => {
    try {
      if (isBinary) {
        // Accumulate audio chunks
        audioChunks.push(data);
        return;
      }

      const message = JSON.parse(data.toString());

      if (message.type === "audio_start") {
        const incomingMimeType =
          typeof message.mimeType === "string" ? message.mimeType : "";

        if (incomingMimeType.startsWith("audio/")) {
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
        if (audioChunks.length === 0) {
          ws.send(JSON.stringify({ type: "error", message: "No audio received" }));
          return;
        }

        // User stopped speaking — process the audio
        const audioBuffer = Buffer.concat(audioChunks);
        audioChunks.length = 0; // clear

        ws.send(JSON.stringify({ type: "status", message: "transcribing" }));

        const transcript = await transcribeAudio(audioBuffer, audioMimeType);
        audioMimeType = "audio/webm";
        if (!transcript.trim()) {
          ws.send(JSON.stringify({ type: "status", message: "empty_transcript" }));
          return;
        }

        ws.send(JSON.stringify({ type: "transcript", text: transcript }));
        ws.send(JSON.stringify({ type: "status", message: "generating_response" }));

        const generated = await generateSessionReplyText({
          userId: context.userId,
          sessionId: context.sessionId,
          userContent: transcript,
        });

        ws.send(
          JSON.stringify({ type: "assistant_text", text: generated.assistantContent })
        );

        ws.send(JSON.stringify({ type: "status", message: "synthesizing_audio" }));
        await streamTTS(generated.assistantContent, context.sessionId, ws);
        ws.send(JSON.stringify({ type: "status", message: "idle" }));
      }
    } catch (err) {
      const message = (err as Error).message || "Voice processing failed";
      logError("voice.ws.processing_failed", {
        sessionId: context.sessionId,
        userId: context.userId,
        error: message,
      });
      ws.send(JSON.stringify({ type: "error", message }));
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
