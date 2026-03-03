import "./test-env";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { db } from "../src/config/db";
import * as groqService from "../src/ai/groq.service";
import { ensureSessionFeedback } from "../src/modules/feedback/feedback.service";

const originalQuery = db.query.bind(db);
const originalConnect = db.connect.bind(db);
const originalGetGroqCompletion = groqService.getGroqCompletion;

afterEach(() => {
  (db as unknown as { query: typeof db.query }).query = originalQuery;
  (db as unknown as { connect: typeof db.connect }).connect = originalConnect;
  (groqService as unknown as { getGroqCompletion: typeof groqService.getGroqCompletion })
    .getGroqCompletion = originalGetGroqCompletion;
});

test("ensureSessionFeedback returns existing feedback without re-generation", async () => {
  let queryCall = 0;
  (db as unknown as { query: typeof db.query }).query = (async () => {
    queryCall += 1;
    if (queryCall === 1) {
      return {
        rows: [
          {
            session_id: "66666666-6666-6666-6666-666666666666",
            user_id: "user-9",
            scenario_id: "77777777-7777-7777-7777-777777777777",
            session_status: "completed",
            scenario_goal: "Practice difficult conversation",
          },
        ],
      } as never;
    }

    return {
      rows: [
        {
          id: "88888888-8888-8888-8888-888888888888",
          session_id: "66666666-6666-6666-6666-666666666666",
          goal_achieved: true,
          confidence_score: 82,
          full_feedback: {
            goalAchieved: true,
            goalAnalysis: "Good outcome",
            communicationPatterns: {
              assertivenessScore: 8,
              clarityScore: 8,
              emotionalControlScore: 7,
              observations: ["Clear asks"],
            },
            keyMoments: [
              {
                userMessage: "I would like to discuss compensation.",
                analysis: "Strong opener",
                alternative: "Add concrete evidence",
              },
            ],
            phrasesToTry: ["Can we align on concrete next steps?"],
            overallSummary: "Good session.",
            confidenceScore: 82,
          },
          generated_at: new Date("2026-02-20T00:00:00.000Z"),
        },
      ],
    } as never;
  }) as typeof db.query;

  const result = await ensureSessionFeedback({
    userId: "user-9",
    sessionId: "66666666-6666-6666-6666-666666666666",
    allowAutoGenerate: true,
  });

  assert.equal(result.generatedNow, false);
  assert.equal(result.feedback.confidenceScore, 82);
  assert.equal(queryCall, 2);
});

test("ensureSessionFeedback generates and persists feedback for completed session", async () => {
  (groqService as unknown as { getGroqCompletion: typeof groqService.getGroqCompletion })
    .getGroqCompletion = (async () => {
      return `{
        "goalAchieved": true,
        "goalAnalysis": "Goal reached with clear structure.",
        "communicationPatterns": {
          "assertivenessScore": 8,
          "clarityScore": 9,
          "emotionalControlScore": 8,
          "observations": ["Clear framing", "Calm under pressure"]
        },
        "keyMoments": [
          {
            "userMessage": "I need a clearer timeline.",
            "analysis": "Direct and specific ask.",
            "alternative": "Could you confirm milestones by date?"
          }
        ],
        "phrasesToTry": ["Can we confirm this in writing?"],
        "overallSummary": "Solid communication with practical next steps.",
        "confidenceScore": 86
      }`;
    }) as typeof groqService.getGroqCompletion;

  const queryResponses = [
    {
      rows: [
        {
          session_id: "99999999-9999-9999-9999-999999999999",
          user_id: "user-5",
          scenario_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          session_status: "completed",
          scenario_goal: "Negotiate a raise",
        },
      ],
    },
    { rows: [] },
    {
      rows: [
        {
          id: "m1",
          session_id: "99999999-9999-9999-9999-999999999999",
          role: "user",
          content: "I want to discuss compensation.",
          token_count: 8,
          created_at: new Date("2026-02-20T01:00:00.000Z"),
        },
        {
          id: "m2",
          session_id: "99999999-9999-9999-9999-999999999999",
          role: "assistant",
          content: "Let us review your recent impact.",
          token_count: 8,
          created_at: new Date("2026-02-20T01:01:00.000Z"),
        },
      ],
    },
  ];

  let queryIndex = 0;
  (db as unknown as { query: typeof db.query }).query = (async () => {
    const next = queryResponses[queryIndex++];
    if (!next) throw new Error("Unexpected db.query call");
    return next as never;
  }) as typeof db.query;

  const transactionQueries: string[] = [];
  const fakeClient = {
    query: async (sql: string) => {
      transactionQueries.push(sql);
      if (sql === "BEGIN") return { rows: [] };
      if (sql.includes("FROM public.feedback")) return { rows: [] };
      if (sql.includes("INSERT INTO public.feedback")) {
        return {
          rows: [
            {
              id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              session_id: "99999999-9999-9999-9999-999999999999",
              goal_achieved: true,
              confidence_score: 86,
              full_feedback: {
                goalAchieved: true,
                goalAnalysis: "Goal reached with clear structure.",
                communicationPatterns: {
                  assertivenessScore: 8,
                  clarityScore: 9,
                  emotionalControlScore: 8,
                  observations: ["Clear framing", "Calm under pressure"],
                },
                keyMoments: [
                  {
                    userMessage: "I need a clearer timeline.",
                    analysis: "Direct and specific ask.",
                    alternative: "Could you confirm milestones by date?",
                  },
                ],
                phrasesToTry: ["Can we confirm this in writing?"],
                overallSummary: "Solid communication with practical next steps.",
                confidenceScore: 86,
              },
              generated_at: new Date("2026-02-20T02:00:00.000Z"),
            },
          ],
        };
      }
      if (sql.includes("COUNT(*)::text AS count")) return { rows: [{ count: "3" }] };
      if (sql.includes("FROM public.progress_snapshots")) return { rows: [] };
      if (sql.includes("INSERT INTO public.progress_snapshots")) return { rows: [] };
      if (sql === "COMMIT") return { rows: [] };
      if (sql === "ROLLBACK") return { rows: [] };
      throw new Error(`Unexpected transactional SQL: ${sql}`);
    },
    release: () => undefined,
  };

  (db as unknown as { connect: typeof db.connect }).connect = (async () => {
    return fakeClient as never;
  }) as typeof db.connect;

  const result = await ensureSessionFeedback({
    userId: "user-5",
    sessionId: "99999999-9999-9999-9999-999999999999",
    allowAutoGenerate: true,
  });

  assert.equal(result.generatedNow, true);
  assert.equal(result.feedback.goalAchieved, true);
  assert.equal(result.feedback.confidenceScore, 86);
  assert.ok(transactionQueries.some((sql) => sql.includes("INSERT INTO public.feedback")));
  assert.ok(
    transactionQueries.some((sql) => sql.includes("INSERT INTO public.progress_snapshots"))
  );
});

test("ensureSessionFeedback rejects active sessions", async () => {
  let callCount = 0;
  (db as unknown as { query: typeof db.query }).query = (async () => {
    callCount += 1;
    if (callCount === 1) {
      return {
        rows: [
          {
            session_id: "12121212-1212-1212-1212-121212121212",
            user_id: "user-7",
            scenario_id: "13131313-1313-1313-1313-131313131313",
            session_status: "active",
            scenario_goal: "Handle a hard conversation",
          },
        ],
      } as never;
    }

    return { rows: [] } as never;
  }) as typeof db.query;

  await assert.rejects(
    () =>
      ensureSessionFeedback({
        userId: "user-7",
        sessionId: "12121212-1212-1212-1212-121212121212",
        allowAutoGenerate: true,
      }),
    (error: unknown) => {
      assert.equal((error as { statusCode?: number }).statusCode, 409);
      return true;
    }
  );
});
