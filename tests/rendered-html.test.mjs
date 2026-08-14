import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

test("declares DS95 metadata and social image", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /DS95 — Turn any learning goal into a 95-day plan/);
  assert.match(layout, /og-dusk-workspace\.png/);
  assert.doesNotMatch(layout, /codex-preview/i);
  assert.doesNotMatch(layout, /next\/font\/google/i);
});

test("finished app replaces starter preview and contains core product surfaces", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /DS95/);
  assert.match(page, /function Heatmap/);
  assert.match(page, /function Today/);
  assert.match(page, /function Syllabus/);
  assert.match(page, /function Analytics/);
  assert.match(page, /function Workspace/);
  assert.match(page, /DS95 LAB · MULTI-LANGUAGE CLOUD IDE/);
  assert.match(page, /Open & run in Lab/);
  assert.match(page, /Open project workspace/);
  assert.match(page, /Link a GitHub repository/);
  assert.match(page, /Learn with \{topic\.resource\.provider\}/);
  assert.match(page, /function gfgUrl/);
  assert.match(page, /toggleTopic/);
  assert.match(page, /Completed from syllabus/);
  assert.match(page, /PORTFOLIO_PROJECTS/);
  assert.match(page, /completedProjectTasks/);
  assert.match(page, /Air Quality & Mobility Intelligence/);
  assert.match(page, /Mortgage Fairness Audit/);
  assert.match(page, /NYC Mobility Analytics Warehouse/);
  assert.match(page, /BADGE CABINET/);
  assert.match(page, /First Step/);
  assert.match(page, /Portfolio Builder/);
  assert.match(page, /DS95 Graduate/);
  assert.match(page, /earnedBadgeCount/);
  assert.doesNotMatch(page, /progress:100/);
  assert.doesNotMatch(page, /i<3\?"earned"/);
  assert.doesNotMatch(page, /geeksforgeeks\.org\/\?s=/);
  assert.match(layout, /og-dusk-workspace\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("generates account-specific AI learning paths with direct resource safeguards", async () => {
  const [route, learningPath, page, env] = await Promise.all([
    readFile(new URL("../app/api/learning-path/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/learning-path.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);
  assert.match(route, /currentUserId/);
  assert.match(route, /api\.groq\.com\/openai\/v1\/chat\/completions/);
  assert.match(route, /openai\/gpt-oss-120b/);
  assert.match(route, /groq\/compound/);
  assert.match(route, /enabled_tools: \["web_search", "visit_website"\]/);
  assert.match(route, /executed_tools/);
  assert.match(route, /max_completion_tokens: 10_000/);
  assert.match(route, /ds95_curriculum/);
  assert.match(route, /ds95_projects/);
  assert.match(route, /type: "json_schema"/);
  assert.match(learningPath, /curriculumFromPath/);
  assert.match(learningPath, /url\.searchParams\.has\("s"\)/);
  assert.match(page, /Generate my 95-day roadmap/);
  assert.match(page, /Learn with the AI study guide/);
  assert.match(page, /verified direct sources/);
  assert.match(page, /Build a new learning path/);
  assert.match(env, /GROQ_API_KEY/);
});

test("workspace uses local runtimes, sandboxed previews and authenticated compiler execution", async () => {
  const [workspace, worker, progressRoute, executeRoute, page, packageJson] = await Promise.all([
    readFile(new URL("../lib/workspace.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/workers/python-runner.js", import.meta.url), "utf8"),
    readFile(new URL("../app/api/progress/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/execute/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(workspace, /runWorkspaceCode/);
  assert.match(workspace, /PGlite\.create/);
  assert.match(workspace, /captureR/);
  assert.match(worker, /pyodide\/v0\.29\.4/);
  assert.match(worker, /runPythonAsync/);
  assert.match(progressRoute, /workspaceFiles/);
  assert.match(progressRoute, /projectRepositories/);
  assert.match(progressRoute, /isWorkspaceLanguage/);
  assert.match(workspace, /notes: "Learning notes"/);
  assert.match(workspace, /javascript: "JavaScript"/);
  assert.match(workspace, /rust: "Rust"/);
  assert.match(workspace, /runWebPreview/);
  assert.match(executeRoute, /currentUserId/);
  assert.match(executeRoute, /enable_network: false/);
  assert.match(executeRoute, /cpu_time_limit: 4/);
  assert.match(executeRoute, /current\.count >= 10/);
  assert.match(page, /sandbox="allow-scripts"/);
  assert.match(page, /24 languages/);
  assert.match(packageJson, /"@electric-sql\/pglite": "0\.5\.4"/);
  assert.match(packageJson, /"webr": "0\.6\.0"/);
});

test("includes Supabase email sign-up, recovery, and account controls", async () => {
  const [source, progress] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/progress.ts", import.meta.url), "utf8"),
  ]);
  assert.match(source, /signInWithPassword/);
  assert.match(source, /resetPasswordForEmail/);
  assert.match(source, /updateUser/);
  assert.match(source, /Create account/);
  assert.match(source, /DS95 never stores your password/);
  assert.match(source, /Sign out/);
  assert.match(source, /progressStorageKey\(session\.user\.id\)/);
  assert.doesNotMatch(source, /localStorage\.(?:getItem|setItem)\("datasprint95"/);
  assert.match(progress, /xp: 0/);
  assert.match(progress, /activities: \{\}/);
  assert.match(progress, /`datasprint95:\$\{userId\}`/);
  assert.match(progress, /isLegacyDemoState/);
});

test("ships complete online documentation and a substantial PDF download", async () => {
  const [documentation, styles, pdf] = await Promise.all([
    readFile(new URL("../app/documentation/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/documentation/documentation.module.css", import.meta.url), "utf8"),
    stat(new URL("../public/docs/datasprint95-complete-guide.pdf", import.meta.url)),
  ]);
  for (const feature of ["Getting started", "Mission dashboard", "Today & focus mode", "Syllabus", "DS95 Lab", "Projects & badges", "Progress, analytics & backups", "Accounts, data & security", "Mobile & accessibility", "Troubleshooting"]) {
    assert.match(documentation, new RegExp(feature.replace(/[&]/g, "&amp;|&"), "i"));
  }
  assert.match(documentation, /datasprint95-complete-guide\.pdf/);
  assert.match(documentation, /download/);
  assert.match(styles, /@media\(max-width:640px\)/);
  assert.ok(pdf.size > 500_000, "documentation PDF should include its visual guide and screenshots");
});
