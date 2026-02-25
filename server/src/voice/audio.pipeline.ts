import { WebSocket } from "ws";
import { convertToSpeech, resolveTtsVoiceSelection } from "./tts.service";

const MAX_TTS_CHARS_PER_CHUNK = 180;

const splitChunkByWords = (text: string, maxChars: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current);
    // Single very long token fallback.
    if (word.length <= maxChars) {
      current = word;
    } else {
      chunks.push(word.slice(0, maxChars));
      current = word.slice(maxChars);
    }
  }

  if (current) chunks.push(current);
  return chunks;
};

const splitForTts = (text: string): string[] => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentenceParts =
    normalized.match(/[^.!?]+[.!?]?/g)?.map((part) => part.trim()).filter(Boolean) ||
    [normalized];

  const chunks: string[] = [];
  for (const part of sentenceParts) {
    if (part.length <= MAX_TTS_CHARS_PER_CHUNK) {
      chunks.push(part);
      continue;
    }

    const phraseParts = part
      .split(/[,;:]\s+/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (!phraseParts.length) {
      chunks.push(...splitChunkByWords(part, MAX_TTS_CHARS_PER_CHUNK));
      continue;
    }

    for (const phrase of phraseParts) {
      if (phrase.length <= MAX_TTS_CHARS_PER_CHUNK) {
        chunks.push(phrase);
      } else {
        chunks.push(...splitChunkByWords(phrase, MAX_TTS_CHARS_PER_CHUNK));
      }
    }
  }

  return chunks;
};

// Splits AI text into short chunks and converts each to audio as it arrives.
export const streamTTS = async (
  text: string,
  _sessionId: string,
  userId: string,
  ws: WebSocket
): Promise<void> => {
  const chunks = splitForTts(text);
  if (!chunks.length) {
    ws.send(JSON.stringify({ type: "response_complete" }));
    return;
  }

  const voiceSelection = await resolveTtsVoiceSelection(userId);
  let sequence = 0;

  for (const chunk of chunks) {
    const audioBuffer = await convertToSpeech(chunk, voiceSelection);
    ws.send(
      JSON.stringify({
        type: "audio_response",
        sequence: sequence++,
        size: audioBuffer.length,
      })
    );
    ws.send(audioBuffer); // Send raw binary audio
  }

  ws.send(JSON.stringify({ type: "response_complete" }));
};
