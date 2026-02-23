export type DifficultyLevel = "cooperative" | "neutral" | "resistant" | "hostile";
export type SessionStatus = "active" | "completed" | "abandoned";

export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
  emailConfirmed: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
  tokenType: string;
}

export interface AuthResponse {
  user: AuthUser;
  session: AuthSession | null;
  requiresEmailConfirmation: boolean;
}

export interface MeUser {
  userId: string;
  email: string | null;
  role: string;
  emailConfirmed: boolean;
  aud: string | null;
}

export interface MeResponse {
  user: MeUser;
}

export interface Scenario {
  id: string;
  title: string;
  category: "work" | "health" | "family" | "social" | "financial" | "legal";
  description: string;
  characterProfile: {
    name: string;
    role: string;
    personality: string[];
    goals: string[];
    emotionalState: string;
  };
  difficultyVariants: Array<{
    level: DifficultyLevel;
    behaviorModifier: string;
  }>;
  isCustom: boolean;
  createdBy: string | null;
  playCount: number;
  createdAt: string;
}

export type ScenarioCategory = Scenario["category"];

export interface CreateCustomScenarioInput {
  title: string;
  category: ScenarioCategory;
  description: string;
  characterProfile: {
    name: string;
    role: string;
    personality: string[];
    goals: string[];
    emotionalState: string;
  };
  difficultyVariants: Array<{
    level: DifficultyLevel;
    behaviorModifier: string;
  }>;
}

export interface CreateScenarioResponse {
  scenario: Scenario;
}

export interface UpdateScenarioResponse {
  scenario: Scenario;
}

export interface DeleteScenarioResponse {
  deleted: boolean;
}

export interface ListScenariosResponse {
  scenarios: Scenario[];
}

export interface Session {
  id: string;
  userId: string;
  scenarioId: string;
  customContext: string | null;
  difficultyLevel: DifficultyLevel;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
}

export interface SessionHistoryItem extends Session {
  scenarioTitle: string;
  scenarioCategory: string;
  messageCount: number;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokenCount?: number;
  createdAt: string;
}

export interface SessionDetailResponse {
  session: Session;
  messages: SessionMessage[];
}

export interface StartSessionInput {
  scenarioId: string;
  difficultyLevel: DifficultyLevel;
  customContext?: string;
}

export interface StartSessionResponse {
  session: Session;
}

export interface EndSessionInput {
  status?: "completed" | "abandoned";
}

export interface QueueStatus {
  state: "queued" | "processing" | "completed" | "failed";
  updatedAt: number;
  attempts: number;
  error?: string;
}

export interface EndSessionResponse {
  session: Session;
  feedback: null;
  feedbackStatus?: "pending";
  feedbackQueue?: QueueStatus;
  feedbackGenerationError?: string;
}

export interface SessionHistoryResponse {
  sessions: SessionHistoryItem[];
}

export interface ClearSessionHistoryResponse {
  deletedCount: number;
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
  keyMoments: Array<{
    userMessage: string;
    analysis: string;
    alternative: string;
  }>;
  phrasesToTry: string[];
  overallSummary: string;
  confidenceScore: number;
}

export interface Feedback {
  id: string;
  sessionId: string;
  goalAchieved: boolean;
  confidenceScore: number;
  fullFeedback: FeedbackResult;
  generatedAt: string;
}

export interface FeedbackReadyPayload {
  feedback: Feedback;
  generatedNow: boolean;
  queueStatus: QueueStatus | null;
}

export interface FeedbackPendingPayload {
  status: "pending";
  queueStatus: QueueStatus;
  message: string;
}

export type FeedbackResponse =
  | {
      kind: "ready";
      data: FeedbackReadyPayload;
    }
  | {
      kind: "pending";
      data: FeedbackPendingPayload;
    };
