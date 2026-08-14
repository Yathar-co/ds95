import { currentUserId } from "@/lib/server-auth";
import { isWorkspaceLanguage, type WorkspaceLanguage } from "@/lib/progress";

export const runtime = "nodejs";
export const maxDuration = 30;

type JudgeLanguage = { id: number; name: string };
type JudgeResult = {
  token?: string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
  status?: { id?: number; description?: string };
};

const LANGUAGE_NAMES: Partial<Record<WorkspaceLanguage, RegExp>> = {
  javascript: /^JavaScript \(Node\.js/i,
  typescript: /^TypeScript/i,
  c: /^C \(/,
  cpp: /^C\+\+ \(/,
  java: /^Java \(/,
  csharp: /^C# \(/,
  go: /^Go \(/,
  rust: /^Rust \(/,
  kotlin: /^Kotlin \(/,
  swift: /^Swift \(/,
  ruby: /^Ruby \(/,
  php: /^PHP \(/,
  bash: /^Bash \(/,
  scala: /^Scala \(/,
  dart: /^Dart \(/,
  lua: /^Lua \(/,
  perl: /^Perl \(/,
  haskell: /^Haskell \(/,
};

const baseUrl = (process.env.JUDGE0_API_URL || "https://ce.judge0.com").replace(/\/$/, "");
const judgeHeaders = () => ({
  "content-type": "application/json",
  ...(process.env.JUDGE0_API_KEY ? { "x-auth-token": process.env.JUDGE0_API_KEY } : {}),
});
let languagesPromise: Promise<JudgeLanguage[]> | null = null;
const executionWindows = new Map<string, { startedAt: number; count: number }>();

function acceptsExecution(userId: string) {
  const now = Date.now();
  const current = executionWindows.get(userId);
  if (!current || now - current.startedAt >= 60_000) {
    executionWindows.set(userId, { startedAt: now, count: 1 });
    if (executionWindows.size > 1_000) {
      for (const [id, window] of executionWindows) if (now - window.startedAt >= 60_000) executionWindows.delete(id);
    }
    return true;
  }
  if (current.count >= 10) return false;
  current.count += 1;
  return true;
}

async function availableLanguages(signal: AbortSignal) {
  if (!languagesPromise) {
    languagesPromise = fetch(`${baseUrl}/languages/`, { headers: judgeHeaders(), signal })
      .then(async response => {
        if (!response.ok) throw new Error(`Language service returned ${response.status}`);
        return response.json() as Promise<JudgeLanguage[]>;
      })
      .catch(error => {
        languagesPromise = null;
        throw error;
      });
  }
  return languagesPromise;
}

function outputText(result: JudgeResult) {
  const sections = [result.compile_output, result.stderr, result.stdout, result.message]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (sections.length) return sections.join("\n").slice(0, 80_000);
  return result.status?.description === "Accepted" ? "Program completed with no output." : result.status?.description || "Execution finished.";
}

export async function POST(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return Response.json({ error: "Sign in is required" }, { status: 401 });
  if (!acceptsExecution(userId)) return Response.json({ error: "Run limit reached. Wait one minute before trying again." }, { status: 429 });

  let language: WorkspaceLanguage;
  let code: string;
  try {
    const raw = await request.text();
    if (raw.length > 30_000) return Response.json({ error: "Source file is too large to execute. Keep runnable files below 30 KB." }, { status: 413 });
    const body = JSON.parse(raw) as Record<string, unknown>;
    if (!isWorkspaceLanguage(body.language) || !LANGUAGE_NAMES[body.language] || typeof body.code !== "string" || !body.code.trim() || body.code.length > 25_000) {
      return Response.json({ error: "Choose a supported compiler language and provide a source file below 25 KB." }, { status: 400 });
    }
    language = body.language;
    code = body.code;
  } catch {
    return Response.json({ error: "Invalid execution request" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const matcher = LANGUAGE_NAMES[language]!;
    const languages = await availableLanguages(controller.signal);
    const selected = [...languages].reverse().find(candidate => matcher.test(candidate.name));
    if (!selected) return Response.json({ error: `${language} is not installed on the configured execution service.` }, { status: 503 });

    const submission = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=false`, {
      method: "POST",
      headers: judgeHeaders(),
      signal: controller.signal,
      body: JSON.stringify({
        language_id: selected.id,
        source_code: code,
        cpu_time_limit: 4,
        wall_time_limit: 8,
        memory_limit: 192_000,
        max_file_size: 2_048,
        enable_network: false,
      }),
    });
    const created = await submission.json() as JudgeResult & { error?: string };
    if (!submission.ok || !created.token) throw new Error(created.error || `Execution service returned ${submission.status}`);

    let result: JudgeResult | null = null;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, attempt ? 500 : 150));
      const response = await fetch(`${baseUrl}/submissions/${encodeURIComponent(created.token)}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,time,memory`, {
        headers: judgeHeaders(),
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Execution status returned ${response.status}`);
      result = await response.json() as JudgeResult;
      if (result.status?.id !== 1 && result.status?.id !== 2) break;
    }
    if (!result || result.status?.id === 1 || result.status?.id === 2) return Response.json({ error: "The compiler queue took too long. Try again shortly." }, { status: 504 });
    const metrics = [result.time ? `${result.time}s` : "", typeof result.memory === "number" ? `${Math.round(result.memory / 1024)} MB` : ""].filter(Boolean).join(" · ");
    return Response.json({ text: outputText(result), runtime: `${selected.name} · isolated execution${metrics ? ` · ${metrics}` : ""}` });
  } catch (error) {
    console.error("Remote code execution failed", error);
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return Response.json({ error: timedOut ? "Code execution timed out. Simplify the program and try again." : "The compiler service is temporarily unavailable." }, { status: timedOut ? 504 : 503 });
  } finally {
    clearTimeout(timeout);
  }
}
