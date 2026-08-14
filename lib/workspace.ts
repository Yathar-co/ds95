import type { WorkspaceFile, WorkspaceLanguage } from "@/lib/progress";

export type WorkspaceRunResult = {
  text: string;
  columns?: string[];
  rows?: Record<string, unknown>[];
  previewHtml?: string;
  runtime: string;
};

export const LANGUAGE_LABELS: Record<WorkspaceLanguage, string> = {
  python: "Python 3",
  r: "R",
  sql: "PostgreSQL",
  javascript: "JavaScript",
  typescript: "TypeScript",
  html: "HTML",
  css: "CSS",
  c: "C",
  cpp: "C++",
  java: "Java",
  csharp: "C#",
  go: "Go",
  rust: "Rust",
  kotlin: "Kotlin",
  swift: "Swift",
  ruby: "Ruby",
  php: "PHP",
  bash: "Bash",
  scala: "Scala",
  dart: "Dart",
  lua: "Lua",
  perl: "Perl",
  haskell: "Haskell",
  notes: "Learning notes",
};

export const LANGUAGE_GROUPS: { label: string; languages: WorkspaceLanguage[] }[] = [
  { label: "Browser & data", languages: ["python", "r", "sql", "javascript", "typescript", "html", "css"] },
  { label: "Systems & apps", languages: ["c", "cpp", "java", "csharp", "go", "rust", "kotlin", "swift"] },
  { label: "Scripting & functional", languages: ["ruby", "php", "bash", "scala", "dart", "lua", "perl", "haskell"] },
  { label: "Writing", languages: ["notes"] },
];

export const WORKSPACE_LANGUAGES = LANGUAGE_GROUPS.flatMap(group => group.languages);

export function suggestedLanguage(text: string): WorkspaceLanguage {
  if (/\b(sql|database|warehouse|table|join|query)\b/i.test(text)) return "sql";
  if (/\b(r language|r overview|statistics|equity)\b/i.test(text)) return "r";
  if (/\b(type ?script|react|angular|vue|node\.js)\b/i.test(text)) return "typescript";
  if (/\b(java ?script|frontend|web app|browser)\b/i.test(text)) return "javascript";
  if (/\b(html|web page|website|accessibility)\b/i.test(text)) return "html";
  if (/\b(c\+\+|cpp)\b/i.test(text)) return "cpp";
  if (/\b(c sharp|c#|\.net)\b/i.test(text)) return "csharp";
  if (/\b(rust)\b/i.test(text)) return "rust";
  if (/\b(golang|go language)\b/i.test(text)) return "go";
  if (/\b(kotlin|android)\b/i.test(text)) return "kotlin";
  if (/\b(swift|ios)\b/i.test(text)) return "swift";
  if (/\b(java)\b/i.test(text)) return "java";
  if (/\b(python|pandas|numpy|scikit|machine learning|data science|analytics|api|automation)\b/i.test(text)) return "python";
  return "notes";
}

export function workspaceStarter(language: WorkspaceLanguage, subject = "today's data") {
  if (language === "notes") return `# ${subject}\n\n## What I understand\n- \n\n## Evidence or examples\n- \n\n## Questions to resolve\n- \n\n## Next action\n- `;
  if (language === "sql") return `-- ${subject}\nCREATE TABLE IF NOT EXISTS sprint_scores (\n  learner TEXT, score INTEGER, completed_on DATE\n);\n\nINSERT INTO sprint_scores VALUES\n  ('Ada', 88, CURRENT_DATE),\n  ('Linus', 94, CURRENT_DATE),\n  ('Grace', 91, CURRENT_DATE);\n\nSELECT learner, score\nFROM sprint_scores\nORDER BY score DESC;`;
  if (language === "r") return `# ${subject}\nscores <- c(88, 94, 91, 85, 97)\ncat("Mean score:", mean(scores), "\\n")\nsummary(scores)`;
  if (language === "python") return `# ${subject}\nfrom statistics import mean\n\nscores = [88, 94, 91, 85, 97]\nprint(f"Mean score: {mean(scores):.1f}")\nprint(f"Best score: {max(scores)}")`;
  const title = subject.replace(/[<>]/g, "");
  const starters: Partial<Record<WorkspaceLanguage, string>> = {
    javascript: `// ${subject}\nconst scores = [88, 94, 91, 85, 97];\nconst mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;\nconsole.log(\`Mean score: \${mean.toFixed(1)}\`);`,
    typescript: `// ${subject}\nconst scores: number[] = [88, 94, 91, 85, 97];\nconst mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;\nconsole.log(\`Mean score: \${mean.toFixed(1)}\`);`,
    html: `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>${title}</title>\n  <style>body{font-family:system-ui;padding:2rem;background:#111;color:#f5f5f5} .card{max-width:36rem;padding:1.5rem;border:1px solid #555;border-radius:1rem}</style>\n</head>\n<body><main class="card"><h1>${title}</h1><p>Edit this page, then press Preview.</p></main></body>\n</html>`,
    css: `/* ${subject} */\n:root { color-scheme: dark; font-family: system-ui, sans-serif; }\nbody { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0a0a0a; color: #fff; }\n.card { width: min(32rem, 80vw); padding: 2rem; border: 1px solid #6b62f2; border-radius: 1.25rem; }`,
    c: `#include <stdio.h>\n\nint main(void) {\n  printf("Hello from C!\\n");\n  return 0;\n}`,
    cpp: `#include <iostream>\n#include <vector>\n\nint main() {\n  std::vector<int> scores{88, 94, 91};\n  std::cout << "Scores: " << scores.size() << "\\n";\n  return 0;\n}`,
    java: `class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from Java!");\n  }\n}`,
    csharp: `using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello from C#!");\n  }\n}`,
    go: `package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello from Go!")\n}`,
    rust: `fn main() {\n    let scores = [88, 94, 91];\n    println!("Scores: {}", scores.len());\n}`,
    kotlin: `fun main() {\n    val scores = listOf(88, 94, 91)\n    println("Scores: ${'$'}{scores.size}")\n}`,
    swift: `let scores = [88, 94, 91]\nprint("Scores: \\(scores.count)")`,
    ruby: `scores = [88, 94, 91]\nputs "Mean score: #{scores.sum.to_f / scores.length}"`,
    php: `<?php\n$scores = [88, 94, 91];\necho "Scores: " . count($scores) . PHP_EOL;`,
    bash: `#!/usr/bin/env bash\nset -euo pipefail\nscores=(88 94 91)\necho "Scores: \${#scores[@]}"`,
    scala: `object Main extends App {\n  val scores = Seq(88, 94, 91)\n  println(s"Scores: ${'$'}{scores.size}")\n}`,
    dart: `void main() {\n  final scores = <int>[88, 94, 91];\n  print('Scores: ${'$'}{scores.length}');\n}`,
    lua: `local scores = {88, 94, 91}\nprint("Scores: " .. #scores)`,
    perl: `use strict;\nuse warnings;\nmy @scores = (88, 94, 91);\nprint "Scores: " . scalar(@scores) . "\\n";`,
    haskell: `main :: IO ()\nmain = do\n  let scores = [88, 94, 91]\n  putStrLn ("Scores: " ++ show (length scores))`,
  };
  return starters[language] || `// ${subject}\n`;
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

function runWebPreview(language: "html" | "css", code: string): WorkspaceRunResult {
  const previewHtml = language === "html" ? code : `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${code}</style></head><body><main class="card"><h1>CSS preview</h1><p>Your stylesheet is applied inside this isolated preview.</p><button>Example action</button></main></body></html>`;
  return { text: "Preview rendered in an isolated frame.", previewHtml, runtime: "Sandboxed DS95 web preview" };
}

async function runRemote(language: WorkspaceLanguage, code: string, accessToken: string): Promise<WorkspaceRunResult> {
  if (!accessToken) throw new Error("Sign in again before running this language.");
  const response = await fetch("/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ language, code }),
  });
  const body = await response.json() as { error?: string; text?: string; runtime?: string };
  if (!response.ok) throw new Error(body.error || "The remote compiler could not run this file.");
  return { text: body.text || "Program completed with no output.", runtime: body.runtime || "Isolated compiler" };
}

export function runWorkspaceCode(language: WorkspaceLanguage, code: string, databaseId: string, accessToken = "") {
  if (language === "notes") return Promise.resolve({ text: "Notes are saved automatically with your DS95 account.", runtime: "DS95 learning notebook" });
  if (language === "python") return runPython(code);
  if (language === "r") return runR(code);
  if (language === "sql") return runSql(code, databaseId);
  if (language === "html" || language === "css") return Promise.resolve(runWebPreview(language, code));
  return runRemote(language, code, accessToken);
}
