import { Response } from "express";
import { groq } from "../config/groq";
import { env } from "../config/env";

type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export const streamGroqResponse = async (
  messages: GroqMessage[],
  res: Response
): Promise<string> => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullContent = "";

  const stream = await groq.chat.completions.create({
    model: env.GROQ_MODEL,
    messages,
    stream: true,
    max_tokens: 500,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) {
      fullContent += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();

  return fullContent;
};

export const getGroqCompletion = async (prompt: string): Promise<string> => {
  const response = await groq.chat.completions.create({
    model: env.GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content || "";
};
