import { WebSocket } from "ws";
import { transcribeAudio } from "./stt.service";
import { streamTTS } from "./audio.pipeline";

export const handleVoiceSession = (ws: WebSocket, sessionId: string) => {
  const audioChunks: Buffer[] = [];

  ws.on("message", async (data: Buffer, isBinary: boolean) => {
    try {
      if (isBinary) {
        // Accumulate audio chunks
        audioChunks.push(data);
        return;
      }

      const message = JSON.parse(data.toString());

      if (message.type === "audio_end") {
        // User stopped speaking — process the audio
        const audioBuffer = Buffer.concat(audioChunks);
        audioChunks.length = 0; // clear

        ws.send(JSON.stringify({ type: "status", message: "transcribing" }));

        const transcript = await transcribeAudio(audioBuffer);
        ws.send(JSON.stringify({ type: "transcript", text: transcript }));

        // AI response via sentence streaming TTS is handled in audio.pipeline.ts
        await streamTTS(transcript, sessionId, ws);
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: "error", message: "Voice processing failed" }));
    }
  });

  ws.on("close", () => {
    console.log(`Voice session closed: ${sessionId}`);
  });
};
