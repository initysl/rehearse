export interface JwtPayload {
  userId: string;
  email: string | null;
  role: string;
  emailConfirmed: boolean;
  aud: string | null;
}

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Scenario {
  id: string;
  title: string;
  category: 'work' | 'health' | 'family' | 'social' | 'financial' | 'legal';
  description: string;
  characterProfile: CharacterProfile;
  difficultyVariants: DifficultyVariant[];
  isCustom: boolean;
  createdBy?: string;
}

export interface CharacterProfile {
  name: string;
  role: string;
  gender?: "male" | "female";
  voiceId?: "autumn" | "diana" | "hannah" | "austin" | "daniel" | "troy";
  personality: string[];
  goals: string[];
  emotionalState: string;
}
export interface DifficultyVariant {
  level: 'cooperative' | 'neutral' | 'resistant' | 'hostile';
  behaviorModifier: string;
}

export interface Session {
  id: string;
  userId: string;
  scenarioId: string;
  customContext?: string;
  difficultyLevel: 'cooperative' | 'neutral' | 'resistant' | 'hostile';
  status: 'active' | 'completed' | 'abandoned';
  startedAt: Date;
  endedAt?: Date;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount?: number;
  createdAt: Date;
}

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

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      accessToken?: string;
      requestId?: string;
    }
  }
}
