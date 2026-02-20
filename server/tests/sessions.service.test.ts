import "./test-env";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { db } from "../src/config/db";
import { endSessionById, startSession } from "../src/modules/sessions/sessions.service";

const originalQuery = db.query.bind(db);
const originalConnect = db.connect.bind(db);

afterEach(() => {
  (db as unknown as { query: typeof db.query }).query = originalQuery;
  (db as unknown as { connect: typeof db.connect }).connect = originalConnect;
});

test("startSession returns null and rolls back when scenario is inaccessible", async () => {
  const executedSql: string[] = [];
  let released = false;

  const fakeClient = {
    query: async (sql: string) => {
      executedSql.push(sql);
      if (sql === "BEGIN") return { rows: [] };
      if (sql.includes("SELECT id")) return { rows: [] };
      if (sql === "ROLLBACK") return { rows: [] };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
    release: () => {
      released = true;
    },
  };

  (db as unknown as { connect: typeof db.connect }).connect = (async () => {
    return fakeClient as never;
  }) as typeof db.connect;

  const result = await startSession("user-1", {
    scenarioId: "33333333-3333-3333-3333-333333333333",
    difficultyLevel: "neutral",
    customContext: "test context",
  });

  assert.equal(result, null);
  assert.ok(executedSql.includes("BEGIN"));
  assert.ok(executedSql.includes("ROLLBACK"));
  assert.equal(released, true);
});

test("endSessionById returns existing session when already ended", async () => {
  const responses = [
    { rows: [] },
    {
      rows: [
        {
          id: "44444444-4444-4444-4444-444444444444",
          user_id: "user-2",
          scenario_id: "55555555-5555-5555-5555-555555555555",
          custom_context: null,
          difficulty_level: "resistant",
          status: "completed",
          started_at: new Date("2026-02-01T10:00:00.000Z"),
          ended_at: new Date("2026-02-01T10:10:00.000Z"),
        },
      ],
    },
  ];

  let callIndex = 0;
  (db as unknown as { query: typeof db.query }).query = (async () => {
    const next = responses[callIndex++];
    return next as never;
  }) as typeof db.query;

  const result = await endSessionById(
    "user-2",
    "44444444-4444-4444-4444-444444444444",
    { status: "completed" }
  );

  assert.ok(result);
  assert.equal(result?.status, "completed");
  assert.equal(result?.userId, "user-2");
});
