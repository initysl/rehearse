// ── Auth ──────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string | null;
  role: string;
  emailConfirmed: boolean;
  aud: string | null;
}

// ── User ──────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  subscriptionTier: "free" | "pro" | "enterprise";
  createdAt: Date;
}

// ── Scenario ──────────────────────────────────────────────────
export interface Scenario {
  id: string;
  title: string;
  category: "work" | "health" | "family" | "social" | "financial" | "legal";
  description: string;
  characterProfile: CharacterProfile;
  difficultyVariants: DifficultyVariant[];
  isCustom: boolean;
  createdBy?: string;
}

export interface CharacterProfile {
  name: string;
  role: string;
  personality: string[];
  goals: string[];
  emotionalState: string;
}

export interface DifficultyVariant {
  level: "cooperative" | "neutral" | "resistant" | "hostile";
  behaviorModifier: string;
}

// ── Session ───────────────────────────────────────────────────
export interface Session {
  id: string;
  userId: string;
  scenarioId: string;
  customContext?: string;
  difficultyLevel: "cooperative" | "neutral" | "resistant" | "hostile";
  status: "active" | "completed" | "abandoned";
  startedAt: Date;
  endedAt?: Date;
}

// ── Message ───────────────────────────────────────────────────
export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokenCount?: number;
  createdAt: Date;
}

// ── Feedback ──────────────────────────────────────────────────
export interface FeedbackResult {
  goalAchieved: boolean;
  goalAnalysis: string;
  communicationPatterns: {
    assertivenessScore: number;
    clarityScore: number;
    emotionalControlScore: number;
    observations: string[];
  };
  keyMoments: {
    userMessage: string;
    analysis: string;
    alternative: string;
  }[];
  phrasesToTry: string[];
  overallSummary: string;
  confidenceScore: number;
}

// ── Express augmentation ──────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      accessToken?: string;
      requestId?: string;
    }
  }
}
