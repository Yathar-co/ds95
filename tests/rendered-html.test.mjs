import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("declares DataSprint metadata and social image", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /DataSprint 95 — Build skills that compound/);
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
  assert.match(page, /DataSprint/);
  assert.match(page, /function Heatmap/);
  assert.match(page, /function Today/);
  assert.match(page, /function Syllabus/);
  assert.match(page, /function Analytics/);
  assert.match(page, /Learn this topic on GeeksforGeeks/);
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
  assert.match(page, /DataSprint Graduate/);
  assert.match(page, /earnedBadgeCount/);
  assert.doesNotMatch(page, /progress:100/);
  assert.doesNotMatch(page, /i<3\?"earned"/);
  assert.doesNotMatch(page, /geeksforgeeks\.org\/\?s=/);
  assert.match(layout, /og-dusk-workspace\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
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
  assert.match(source, /DataSprint never stores your password/);
  assert.match(source, /Sign out/);
  assert.match(source, /progressStorageKey\(session\.user\.id\)/);
  assert.doesNotMatch(source, /localStorage\.(?:getItem|setItem)\("datasprint95"/);
  assert.match(progress, /xp: 0/);
  assert.match(progress, /activities: \{\}/);
  assert.match(progress, /`datasprint95:\$\{userId\}`/);
  assert.match(progress, /isLegacyDemoState/);
});
