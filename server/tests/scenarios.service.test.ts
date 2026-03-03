import "./test-env";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { db } from "../src/config/db";
import {
  createCustomScenario,
  listScenarios,
} from "../src/modules/scenarios/scenarios.service";

const originalQuery = db.query.bind(db);

afterEach(() => {
  (db as unknown as { query: typeof db.query }).query = originalQuery;
});

test("listScenarios returns mapped scenarios with visibility filters", async () => {
  let capturedSql = "";
  let capturedParams: unknown[] = [];

  (db as unknown as { query: typeof db.query }).query = (async (
    sql: string,
    params: unknown[]
  ) => {
    capturedSql = sql;
    capturedParams = params;

    return {
      rows: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          title: "Salary Negotiation",
          category: "work",
          description: "Practice salary negotiation",
          character_profile: {
            name: "Jordan",
            role: "Manager",
            gender: "male",
            voiceId: "daniel",
            personality: ["fair"],
            goals: ["control budget"],
            emotionalState: "calm",
          },
          difficulty_variants: [
            { level: "neutral", behaviorModifier: "Balanced responses" },
          ],
          is_custom: false,
          created_by: null,
          play_count: 10,
          created_at: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
    } as never;
  }) as typeof db.query;

  const result = await listScenarios("user-1", {
    category: undefined,
    search: undefined,
    customOnly: false,
    limit: 20,
    offset: 0,
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Salary Negotiation");
  assert.equal(result[0].characterProfile.name, "Jordan");
  assert.match(capturedSql, /is_custom = FALSE OR s\.created_by = \$1/);
  assert.deepEqual(capturedParams, ["user-1", 20, 0]);
});

test("createCustomScenario inserts with user as owner", async () => {
  let capturedParams: unknown[] = [];

  (db as unknown as { query: typeof db.query }).query = (async (
    _sql: string,
    params: unknown[]
  ) => {
    capturedParams = params;

    return {
      rows: [
        {
          id: "22222222-2222-2222-2222-222222222222",
          title: "Custom Scenario",
          category: "social",
          description: "custom description",
          character_profile: {
            name: "Alex",
            role: "Neighbor",
            gender: "male",
            voiceId: "austin",
            personality: ["defensive"],
            goals: ["avoid conflict"],
            emotionalState: "guarded",
          },
          difficulty_variants: [
            { level: "resistant", behaviorModifier: "Push back" },
          ],
          is_custom: true,
          created_by: "user-42",
          play_count: 0,
          created_at: new Date("2026-01-02T00:00:00.000Z"),
        },
      ],
    } as never;
  }) as typeof db.query;

  const created = await createCustomScenario("user-42", {
    title: "Custom Scenario",
    category: "social",
    description: "custom description",
    characterProfile: {
      name: "Alex",
      role: "Neighbor",
      gender: "male",
      voiceId: "austin",
      personality: ["defensive"],
      goals: ["avoid conflict"],
      emotionalState: "guarded",
    },
    difficultyVariants: [{ level: "resistant", behaviorModifier: "Push back" }],
  });

  assert.equal(created.isCustom, true);
  assert.equal(created.createdBy, "user-42");
  assert.equal(capturedParams[capturedParams.length - 1], "user-42");
});
