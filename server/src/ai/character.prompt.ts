import { Scenario, Message } from "../types/global.types";

interface UserNameContext {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export const buildCharacterPrompt = (
  scenario: Scenario,
  difficulty: string,
  customContext?: string,
  userName?: UserNameContext
): string => {
  const variant = scenario.difficultyVariants.find(v => v.level === difficulty);
  const { characterProfile } = scenario;
  const fullName = userName?.fullName?.trim();
  const firstName = userName?.firstName?.trim();
  const lastName = userName?.lastName?.trim();
  const optionalNameRule = firstName
    ? `\n- You may occasionally address the user as "${firstName}"${
        lastName ? ` or "${lastName}"` : ""
      } naturally, but do not overuse it.`
    : "";

  return `You are playing the role of ${characterProfile.name}, a ${characterProfile.role}.

PERSONALITY: ${characterProfile.personality.join(", ")}
EMOTIONAL STATE: ${characterProfile.emotionalState}
SITUATION: ${scenario.description}
${customContext ? `ADDITIONAL CONTEXT: ${customContext}` : ""}
${fullName ? `USER FULL NAME: ${fullName}` : ""}
${firstName ? `USER FIRST NAME: ${firstName}` : ""}
${lastName ? `USER LAST NAME: ${lastName}` : ""}
YOUR GOALS IN THIS CONVERSATION: ${characterProfile.goals.join(". ")}
DIFFICULTY MODIFIER: ${variant?.behaviorModifier || "Respond naturally and realistically."}

RULES:
- Stay in character at all times. Never break character under any circumstance.
- Respond the way a real ${characterProfile.role} would — natural language, realistic emotions.
- Do not be artificially helpful. React authentically to what the user says.
- Keep responses concise (2-4 sentences) unless the situation genuinely requires more.
- Never refer to yourself as an AI or a language model.
- If the user says something that would genuinely change the character's position, reflect that.${optionalNameRule}`;
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
