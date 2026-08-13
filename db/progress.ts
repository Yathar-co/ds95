import { neon } from "@neondatabase/serverless";

type ProgressRecord = {
  state: unknown;
  updated_at: string;
};

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(connectionString);
}

export async function getProgress(userId: string): Promise<ProgressRecord | null> {
  const sql = getSql();
  await ensureProgressTable(sql);
  const rows = await sql`
    SELECT state, updated_at
    FROM datasprint_progress
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  return (rows[0] as ProgressRecord | undefined) ?? null;
}

export async function saveProgress(userId: string, state: unknown): Promise<string> {
  const sql = getSql();
  await ensureProgressTable(sql);
  const serialized = JSON.stringify(state);
  const rows = await sql`
    INSERT INTO datasprint_progress (user_id, state, updated_at)
    VALUES (${userId}, ${serialized}::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET state = EXCLUDED.state, updated_at = NOW()
    RETURNING updated_at
  `;
  return String(rows[0]?.updated_at ?? new Date().toISOString());
}

async function ensureProgressTable(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS datasprint_progress (
      user_id TEXT PRIMARY KEY,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}
