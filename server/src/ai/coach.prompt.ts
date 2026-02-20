import { Message } from "../types/global.types";

export const buildCoachPrompt = (
  scenarioGoal: string,
  transcript: Message[]
): string => {
  const formatted = transcript
    .filter(m => m.role !== "system")
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  return `You are an expert communication coach. Analyze the following practice conversation and return ONLY a valid JSON object — no explanation, no markdown, no preamble.

SCENARIO GOAL: ${scenarioGoal}

TRANSCRIPT:
${formatted}

Return this exact JSON structure:
{
  "goalAchieved": boolean,
  "goalAnalysis": "string",
  "communicationPatterns": {
    "assertivenessScore": number (1-10),
    "clarityScore": number (1-10),
    "emotionalControlScore": number (1-10),
    "observations": ["string"]
  },
  "keyMoments": [
    { "userMessage": "string", "analysis": "string", "alternative": "string" }
  ],
  "phrasesToTry": ["string"],
  "overallSummary": "string",
  "confidenceScore": number (1-100)
}`;
};
