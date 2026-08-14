import type { WorkspaceFile, WorkspaceLanguage } from "@/lib/progress";

export type WorkspaceRunResult = {
  text: string;
  columns?: string[];
  rows?: Record<string, unknown>[];
  runtime: string;
};

export const LANGUAGE_LABELS: Record<WorkspaceLanguage, string> = {
  python: "Python 3",
  r: "R",
  sql: "PostgreSQL",
};

export function suggestedLanguage(text: string): WorkspaceLanguage {
  if (/\b(sql|database|warehouse|table|join|query)\b/i.test(text)) return "sql";
  if (/\b(r language|r overview|statistics|equity)\b/i.test(text)) return "r";
  return "python";
}

export function workspaceStarter(language: WorkspaceLanguage, subject = "today's data") {
  if (language === "sql") return `-- ${subject}\nCREATE TABLE IF NOT EXISTS sprint_scores (\n  learner TEXT, score INTEGER, completed_on DATE\n);\n\nINSERT INTO sprint_scores VALUES\n  ('Ada', 88, CURRENT_DATE),\n  ('Linus', 94, CURRENT_DATE),\n  ('Grace', 91, CURRENT_DATE);\n\nSELECT learner, score\nFROM sprint_scores\nORDER BY score DESC;`;
  if (language === "r") return `# ${subject}\nscores <- c(88, 94, 91, 85, 97)\ncat("Mean score:", mean(scores), "\\n")\nsummary(scores)`;
  return `# ${subject}\nfrom statistics import mean\n\nscores = [88, 94, 91, 85, 97]\nprint(f"Mean score: {mean(scores):.1f}")\nprint(f"Best score: {max(scores)}")`;
}

export function makeWorkspaceFile(input: { id: string; name: string; language: WorkspaceLanguage; day?: number; projectId?: string; subject?: string }): WorkspaceFile {
  return { ...input, code: workspaceStarter(input.language, input.subject), updatedAt: new Date().toISOString() };
}

let pythonWorker: Worker | null = null;
let pythonSequence = 0;

async function runPython(code: string): Promise<WorkspaceRunResult> {
  if (!pythonWorker) pythonWorker = new Worker("/workers/python-runner.js");
  const worker = pythonWorker;
  const id = ++pythonSequence;
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker.terminate();
      pythonWorker = null;
      reject(new Error("Python stopped after 30 seconds. Check for an infinite loop and try again."));
    }, 30_000);
    const listener = (event: MessageEvent<{ id: number; ok: boolean; text: string }>) => {
      if (event.data.id !== id) return;
      window.clearTimeout(timeout);
      worker.removeEventListener("message", listener);
      if (event.data.ok) resolve({ text: event.data.text, runtime: "Pyodide 0.29.4 · Python in a Web Worker" });
      else reject(new Error(event.data.text));
    };
    worker.addEventListener("message", listener);
    worker.postMessage({ id, code });
  });
}

let webRPromise: Promise<import("webr").WebR> | null = null;
async function runR(code: string): Promise<WorkspaceRunResult> {
  if (!webRPromise) webRPromise = (import(
    /* webpackIgnore: true */
    // @ts-expect-error Fixed-version remote ESM is loaded by the browser at runtime.
    "https://webr.r-wasm.org/v0.6.0/webr.mjs"
  ) as Promise<typeof import("webr")>).then(async ({ WebR }) => {
    const instance = new WebR();
    await instance.init();
    return instance;
  });
  const webR = await webRPromise;
  const shelter = await new webR.Shelter();
  try {
    const capture = await shelter.captureR(code, { withAutoprint: true });
    const text = capture.output.map((item) => typeof item.data === "string" ? item.data : JSON.stringify(item.data)).join("\n");
    return { text: text || (capture.images.length ? `${capture.images.length} plot(s) created.` : "Code completed with no output."), runtime: "WebR 0.6.0 · R in WebAssembly" };
  } finally {
    await shelter.purge();
  }
}

const sqlDatabases = new Map<string, Promise<import("@electric-sql/pglite").PGlite>>();
async function runSql(code: string, databaseId: string): Promise<WorkspaceRunResult> {
  let database = sqlDatabases.get(databaseId);
  if (!database) {
    database = import("@electric-sql/pglite").then(({ PGlite }) => PGlite.create(`idb://datasprint95-${databaseId.replace(/[^a-z0-9-]/gi, "-")}`));
    sqlDatabases.set(databaseId, database);
  }
  const pg = await database;
  const results = await pg.exec(code);
  const last = [...results].reverse().find((result) => result.rows?.length || result.fields?.length);
  const rows = (last?.rows || []) as Record<string, unknown>[];
  const columns = last?.fields?.map((field) => field.name) || (rows[0] ? Object.keys(rows[0]) : []);
  return { text: rows.length ? `${rows.length} row${rows.length === 1 ? "" : "s"} returned.` : "Query completed successfully.", columns, rows, runtime: "PGlite 0.5.4 · browser-local PostgreSQL" };
}

export function runWorkspaceCode(language: WorkspaceLanguage, code: string, databaseId: string) {
  if (language === "python") return runPython(code);
  if (language === "r") return runR(code);
  return runSql(code, databaseId);
}
