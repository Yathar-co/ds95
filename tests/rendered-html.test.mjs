import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders DataSprint metadata and social image", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>DataSprint 95 — Build skills that compound<\/title>/i);
  assert.match(html, /property="og:image" content="http:\/\/localhost(?::3000)?\/og-dusk-workspace.png"/i);
  assert.doesNotMatch(html, /codex-preview/i);
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
  assert.doesNotMatch(page, /geeksforgeeks\.org\/\?s=/);
  assert.match(layout, /og-dusk-workspace\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
