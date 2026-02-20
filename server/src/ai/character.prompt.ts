import { Scenario, Message } from "../types/global.types";

export const buildCharacterPrompt = (
  scenario: Scenario,
  difficulty: string,
  customContext?: string
): string => {
  const variant = scenario.difficultyVariants.find(v => v.level === difficulty);
  const { characterProfile } = scenario;

  return `You are playing the role of ${characterProfile.name}, a ${characterProfile.role}.

PERSONALITY: ${characterProfile.personality.join(", ")}
EMOTIONAL STATE: ${characterProfile.emotionalState}
SITUATION: ${scenario.description}
${customContext ? `ADDITIONAL CONTEXT: ${customContext}` : ""}
YOUR GOALS IN THIS CONVERSATION: ${characterProfile.goals.join(". ")}
DIFFICULTY MODIFIER: ${variant?.behaviorModifier || "Respond naturally and realistically."}

RULES:
- Stay in character at all times. Never break character under any circumstance.
- Respond the way a real ${characterProfile.role} would — natural language, realistic emotions.
- Do not be artificially helpful. React authentically to what the user says.
- Keep responses concise (2-4 sentences) unless the situation genuinely requires more.
- Never refer to yourself as an AI or a language model.
- If the user says something that would genuinely change the character's position, reflect that.`;
};

export const buildMessages = (
  systemPrompt: string,
  history: Message[]
): { role: "system" | "user" | "assistant"; content: string }[] => {
  return [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content
    }))
  ];
};
