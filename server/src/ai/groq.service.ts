import { Response } from "express";
import { groq } from "../config/groq";
import { env } from "../config/env";
import { logWarn } from "../utils/logger";

type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

const DEFAULT_COMPLETION_TIMEOUT_MS = 15000;
const DEFAULT_STREAM_TIMEOUT_MS = 30000;
const DEFAULT_RETRIES = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(
  operation: () => Promise<T>,
  options: {
    retries?: number;
    retryDelayMs?: number;
    event: string;
  }
): Promise<T> => {
  const retries = options.retries ?? DEFAULT_RETRIES;
  const retryDelayMs = options.retryDelayMs ?? 350;

  let attempt = 0;
  while (true) {
    try {
      attempt += 1;
      return await operation();
    } catch (error) {
      if (attempt > retries) throw error;
      logWarn(options.event, {
        attempt,
        retries,
        error: (error as Error).message,
      });
      await sleep(retryDelayMs * attempt);
    }
  }
};

export const streamGroqResponse = async (
  messages: GroqMessage[],
  res: Response
): Promise<string> => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullContent = "";

  const timeoutMs = env.GROQ_STREAM_TIMEOUT_MS || DEFAULT_STREAM_TIMEOUT_MS;
  await withRetry(
    async () => {
      const stream = await Promise.race([
        groq.chat.completions.create({
          model: env.GROQ_MODEL,
          messages,
          stream: true,
          max_tokens: 500,
        }),
        new Promise<never>((_resolve, reject) =>
          setTimeout(
            () => reject(new Error(`Groq streaming request timed out after ${timeoutMs}ms`)),
            timeoutMs
          )
        ),
      ]);

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || "";
        if (token) {
          fullContent += token;
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      }
    },
    { event: "groq.stream.retry" }
  );

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();

  return fullContent;
};

export const getGroqChatCompletion = async (
  messages: GroqMessage[]
): Promise<string> => {
  const timeoutMs = env.GROQ_COMPLETION_TIMEOUT_MS || DEFAULT_COMPLETION_TIMEOUT_MS;

  return withRetry(
    async () => {
      const response = await Promise.race([
        groq.chat.completions.create({
          model: env.GROQ_MODEL,
          messages,
          max_tokens: 1500,
        }),
        new Promise<never>((_resolve, reject) =>
          setTimeout(
            () => reject(new Error(`Groq completion request timed out after ${timeoutMs}ms`)),
            timeoutMs
          )
        ),
      ]);

      return response.choices[0]?.message?.content || "";
    },
    { event: "groq.completion.retry" }
  );
};

export const getGroqCompletion = async (prompt: string): Promise<string> => {
  return getGroqChatCompletion([{ role: "user", content: prompt }]);
};
