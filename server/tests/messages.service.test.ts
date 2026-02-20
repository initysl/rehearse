import "./test-env";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { db } from "../src/config/db";
import { redis } from "../src/config/redis";
import * as groqService from "../src/ai/groq.service";
import { streamSessionMessage } from "../src/modules/messages/messages.service";

const originalQuery = db.query.bind(db);
const originalRedisGet = redis.get.bind(redis);
const originalRedisSet = redis.set.bind(redis);
const originalStreamGroqResponse = groqService.streamGroqResponse;

afterEach(() => {
  (db as unknown as { query: typeof db.query }).query = originalQuery;
  (redis as unknown as { get: typeof redis.get }).get = originalRedisGet;
  (redis as unknown as { set: typeof redis.set }).set = originalRedisSet;
  (groqService as unknown as {
    streamGroqResponse: typeof groqService.streamGroqResponse;
  }).streamGroqResponse = originalStreamGroqResponse;
});

test("streamSessionMessage throws 404 when session is not found", async () => {
  (db as unknown as { query: typeof db.query }).query = (async () => {
    return { rows: [] } as never;
  }) as typeof db.query;

  await assert.rejects(
    () =>
      streamSessionMessage({
        userId: "user-1",
        sessionId: "14141414-1414-1414-1414-141414141414",
        payload: { content: "hello" },
        response: {} as never,
      }),
    (error: unknown) => {
      assert.equal((error as { statusCode?: number }).statusCode, 404);
      return true;
    }
  );
});

test("streamSessionMessage persists user and assistant messages and updates cache", async () => {
  let redisSetCalled = false;
  let queryCount = 0;

  (redis as unknown as { get: typeof redis.get }).get = (async () => null) as typeof redis.get;
  (redis as unknown as { set: typeof redis.set }).set = (async () => {
    redisSetCalled = true;
    return "OK";
  }) as typeof redis.set;

  (groqService as unknown as {
    streamGroqResponse: typeof groqService.streamGroqResponse;
  }).streamGroqResponse = (async () => "Assistant response from model") as typeof groqService.streamGroqResponse;

  (db as unknown as { query: typeof db.query }).query = (async (
    sql: string,
    params?: unknown[]
  ) => {
    queryCount += 1;

    if (sql.includes("FROM public.sessions s")) {
      return {
        rows: [
          {
            session_id: "15151515-1515-1515-1515-151515151515",
            user_id: "user-2",
            scenario_id: "16161616-1616-1616-1616-161616161616",
            difficulty_level: "neutral",
            custom_context: null,
            status: "active",
            scenario_title: "Negotiation",
            scenario_category: "work",
            scenario_description: "Negotiate with manager",
            character_profile: {
              name: "Jordan",
              role: "Manager",
              personality: ["measured"],
              goals: ["control budget"],
              emotionalState: "calm",
            },
            difficulty_variants: [
              { level: "neutral", behaviorModifier: "Balanced responses" },
            ],
            scenario_is_custom: false,
            scenario_created_by: null,
          },
        ],
      } as never;
    }

    if (sql.includes("INSERT INTO public.messages") && params?.[1] === "user") {
      return {
        rows: [
          {
            id: "u-msg",
            session_id: "15151515-1515-1515-1515-151515151515",
            role: "user",
            content: params?.[2],
            token_count: 3,
            created_at: new Date("2026-02-20T10:00:00.000Z"),
          },
        ],
      } as never;
    }

    if (sql.includes("FROM public.messages")) {
      return {
        rows: [
          {
            id: "u-msg",
            session_id: "15151515-1515-1515-1515-151515151515",
            role: "user",
            content: "I need a better compensation package.",
            token_count: 8,
            created_at: new Date("2026-02-20T10:00:00.000Z"),
          },
        ],
      } as never;
    }

    if (sql.includes("INSERT INTO public.messages") && params?.[1] === "assistant") {
      return {
        rows: [
          {
            id: "a-msg",
            session_id: "15151515-1515-1515-1515-151515151515",
            role: "assistant",
            content: "Assistant response from model",
            token_count: 5,
            created_at: new Date("2026-02-20T10:00:03.000Z"),
          },
        ],
      } as never;
    }

    throw new Error(`Unexpected SQL in test: ${sql}`);
  }) as typeof db.query;

  await streamSessionMessage({
    userId: "user-2",
    sessionId: "15151515-1515-1515-1515-151515151515",
    payload: { content: "I need a better compensation package." },
    response: {} as never,
  });

  assert.ok(queryCount >= 4);
  assert.equal(redisSetCalled, true);
});
