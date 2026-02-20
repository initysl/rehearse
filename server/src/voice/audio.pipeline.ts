import { WebSocket } from "ws";
import { convertToSpeech } from "./tts.service";

// Splits AI text into sentences and converts each to audio as it arrives
export const streamTTS = async (
  text: string,
  _sessionId: string,
  ws: WebSocket
): Promise<void> => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let sequence = 0;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    const audioBuffer = await convertToSpeech(trimmed);
    ws.send(JSON.stringify({
      type: "audio_response",
      sequence: sequence++,
      size: audioBuffer.length,
    }));
    ws.send(audioBuffer); // Send raw binary audio
  }

  ws.send(JSON.stringify({ type: "response_complete" }));
};
