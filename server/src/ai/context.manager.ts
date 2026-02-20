import { Message } from "../types/global.types";

const MAX_MESSAGES = 40; // Keep last 40 messages to stay within token limits

export const manageContext = (messages: Message[]): Message[] => {
  if (messages.length <= MAX_MESSAGES) return messages;

  // Keep first message (scene-setter) + most recent messages
  const first = messages.slice(0, 1);
  const recent = messages.slice(-( MAX_MESSAGES - 1));
  return [...first, ...recent];
};
