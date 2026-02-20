import "./test-env";
import assert from "node:assert/strict";
import http from "http";
import { AddressInfo } from "node:net";
import { afterEach, TestContext, test } from "node:test";
import app from "../src/app";
import { db } from "../src/config/db";
import { supabaseAuthApi } from "../src/config/supabase";

const originalQuery = db.query.bind(db);
const originalGetUser = supabaseAuthApi.getUserFromAccessToken;

class HttpListenNotPermittedError extends Error {}

afterEach(() => {
  (db as unknown as { query: typeof db.query }).query = originalQuery;
  (supabaseAuthApi as unknown as {
    getUserFromAccessToken: typeof supabaseAuthApi.getUserFromAccessToken;
  }).getUserFromAccessToken = originalGetUser;
});

const createTestToken = (): string => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url"
  );
  const payload = Buffer.from(
    JSON.stringify({
      iss: `${process.env.SUPABASE_URL}/auth/v1`,
      aud: process.env.SUPABASE_JWT_AUDIENCE || "authenticated",
      sub: "user-http",
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString("base64url");

  return `${header}.${payload}.sig`;
};

const withServer = async (
  run: (baseUrl: string) => Promise<void>
): Promise<void> => {
  const server = http.createServer(app);
  try {
    await new Promise<void>((resolve, reject) => {
      const handleError = (error: Error) => {
        server.off("listening", handleListening);
        reject(error);
      };
      const handleListening = () => {
        server.off("error", handleError);
        resolve();
      };

      server.once("error", handleError);
      server.once("listening", handleListening);
      server.listen(0, "127.0.0.1");
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EPERM") {
      throw new HttpListenNotPermittedError("HTTP listen not permitted in this runtime");
    }
    throw error;
  }
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  }
};

const runOrSkip = async (t: TestContext, run: () => Promise<void>) => {
  try {
    await run();
  } catch (error) {
    if (error instanceof HttpListenNotPermittedError) {
      t.skip("HTTP listen is not permitted in this environment");
      return;
    }
    throw error;
  }
};

test("GET /scenarios requires auth", async (t) => {
  await runOrSkip(t, async () =>
    withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/scenarios`);
      assert.equal(response.status, 401);
      const body = (await response.json()) as { error?: string };
      assert.ok(body.error);
    })
  );
});

test("POST /sessions/:id/end queues feedback for completed session", async (t) => {
  (supabaseAuthApi as unknown as {
    getUserFromAccessToken: typeof supabaseAuthApi.getUserFromAccessToken;
  }).getUserFromAccessToken = (async () => ({
    id: "user-http",
    email: "user@example.com",
    role: "authenticated",
    email_confirmed_at: "2026-02-20T00:00:00.000Z",
  })) as typeof supabaseAuthApi.getUserFromAccessToken;

  let callCount = 0;
  (db as unknown as { query: typeof db.query }).query = (async () => {
    callCount += 1;
    if (callCount === 1) {
      return {
        rows: [
          {
            id: "20202020-2020-2020-2020-202020202020",
            user_id: "user-http",
            scenario_id: "30303030-3030-3030-3030-303030303030",
            custom_context: null,
            difficulty_level: "neutral",
            status: "completed",
            started_at: new Date("2026-02-20T10:00:00.000Z"),
            ended_at: new Date("2026-02-20T10:10:00.000Z"),
          },
        ],
      } as never;
    }
    if (callCount === 2) {
      return { rows: [] } as never;
    }
    return { rows: [] } as never;
  }) as typeof db.query;

  await runOrSkip(t, async () =>
    withServer(async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/sessions/20202020-2020-2020-2020-202020202020/end`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createTestToken()}`,
          },
          body: JSON.stringify({ status: "completed" }),
        }
      );

      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        feedbackStatus?: string;
        feedbackQueue?: { state?: string };
      };
      assert.equal(body.feedbackStatus, "pending");
      assert.equal(body.feedbackQueue?.state, "queued");
    })
  );
});

test("GET /feedback/:sessionId returns pending when not generated yet", async (t) => {
  (supabaseAuthApi as unknown as {
    getUserFromAccessToken: typeof supabaseAuthApi.getUserFromAccessToken;
  }).getUserFromAccessToken = (async () => ({
    id: "user-http",
    email: "user@example.com",
    role: "authenticated",
    email_confirmed_at: "2026-02-20T00:00:00.000Z",
  })) as typeof supabaseAuthApi.getUserFromAccessToken;

  let callCount = 0;
  (db as unknown as { query: typeof db.query }).query = (async () => {
    callCount += 1;
    if (callCount === 1) {
      return {
        rows: [
          {
            session_id: "40404040-4040-4040-4040-404040404040",
            user_id: "user-http",
            scenario_id: "50505050-5050-5050-5050-505050505050",
            session_status: "completed",
            scenario_goal: "Negotiate salary",
          },
        ],
      } as never;
    }

    return { rows: [] } as never;
  }) as typeof db.query;

  await runOrSkip(t, async () =>
    withServer(async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/feedback/40404040-4040-4040-4040-404040404040`,
        {
          headers: {
            authorization: `Bearer ${createTestToken()}`,
          },
        }
      );

      assert.equal(response.status, 202);
      const body = (await response.json()) as {
        status?: string;
        queueStatus?: { state?: string };
      };
      assert.equal(body.status, "pending");
      assert.equal(body.queueStatus?.state, "queued");
    })
  );
});
