import { createClient } from "@supabase/supabase-js";
import { getProgress, saveProgress } from "@/db/progress";

export const runtime = "nodejs";

async function currentUserId(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !publishableKey) return null;

  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user?.id ?? null;
}

export async function GET(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return Response.json({ error: "Sign in is required" }, { status: 401 });

  try {
    const progress = await getProgress(userId);
    return Response.json(progress ?? { state: null, updated_at: null });
  } catch (error) {
    console.error("Unable to load DataSprint progress", error);
    return Response.json({ error: "Progress is temporarily unavailable" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return Response.json({ error: "Sign in is required" }, { status: 401 });

  let state: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 500_000) return Response.json({ error: "Progress payload is too large" }, { status: 413 });
    state = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid progress payload" }, { status: 400 });
  }

  if (!isProgressState(state)) {
    return Response.json({ error: "Invalid progress state" }, { status: 400 });
  }

  try {
    const updatedAt = await saveProgress(userId, state);
    return Response.json({ ok: true, updated_at: updatedAt });
  } catch (error) {
    console.error("Unable to save DataSprint progress", error);
    return Response.json({ error: "Progress could not be saved" }, { status: 503 });
  }
}

function isProgressState(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  return (
    typeof state.name === "string" &&
    typeof state.startDate === "string" &&
    typeof state.dailyTarget === "number" &&
    typeof state.onboarded === "boolean" &&
    typeof state.activities === "object" &&
    state.activities !== null &&
    (state.completedTopics === undefined ||
      (Array.isArray(state.completedTopics) && state.completedTopics.every((topic) => typeof topic === "string"))) &&
    (state.completedProjectTasks === undefined ||
      (Array.isArray(state.completedProjectTasks) && state.completedProjectTasks.every((task) => typeof task === "string"))) &&
    (state.workspaceFiles === undefined ||
      (Array.isArray(state.workspaceFiles) && state.workspaceFiles.length <= 100 && state.workspaceFiles.every(isWorkspaceFile))) &&
    (state.projectRepositories === undefined || isRepositoryMap(state.projectRepositories)) &&
    Array.isArray(state.personalTasks) &&
    Array.isArray(state.freezes)
  );
}

function isWorkspaceFile(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const file = value as Record<string, unknown>;
  return typeof file.id === "string" && file.id.length <= 120 &&
    typeof file.name === "string" && file.name.length <= 120 &&
    (file.language === "python" || file.language === "r" || file.language === "sql") &&
    typeof file.code === "string" && file.code.length <= 60_000 &&
    typeof file.updatedAt === "string" &&
    (file.day === undefined || (Number.isInteger(file.day) && Number(file.day) > 0 && Number(file.day) <= 95)) &&
    (file.projectId === undefined || (typeof file.projectId === "string" && file.projectId.length <= 100));
}

function isRepositoryMap(value: unknown) {
  return !!value && typeof value === "object" && !Array.isArray(value) &&
    Object.entries(value).every(([key, url]) => key.length <= 100 && typeof url === "string" && url.length <= 300);
}
