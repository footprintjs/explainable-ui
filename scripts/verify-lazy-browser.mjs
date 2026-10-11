/** Actual packed-package/browser proof. No source alias, provider or paid calls. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const evidenceRoot = process.env.LENS_BROWSER_EVIDENCE_ROOT || tmpdir();
await mkdir(evidenceRoot, { recursive: true });
const evidence = await mkdtemp(join(evidenceRoot, "lens-lazy-browser-"));
console.log(`Browser evidence (retained on failure): ${evidence}`);
process.on("uncaughtExceptionMonitor", error => {
  writeFileSync(join(evidence, "failure.json"), JSON.stringify({ passed: false, error: error.stack ?? String(error) }, null, 2));
});
const consumer = join(evidence, "consumer");
await mkdir(consumer);
const npm = (args, cwd) => process.env.npm_execpath
  ? execFileSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
  : execFileSync("npm", args, { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const [packed] = JSON.parse(npm(["pack", "--json", "--pack-destination", evidence], root));
await writeFile(join(consumer, "package.json"), JSON.stringify({
  name: "lens-lazy-browser-proof", version: "0.0.0", private: true, type: "module",
  dependencies: {
    "footprint-explainable-ui": `file:${join(evidence, packed.filename)}`,
    react: "19.2.5", "react-dom": "19.2.5", "@xyflow/react": "12.10.2", dagre: "0.8.5",
  },
}, null, 2));
// Normal npm peer resolution, not --force, --legacy-peer-deps or post-install pruning.
npm(["install", "--strict-peer-deps", "--no-audit", "--no-fund"], consumer);
await writeFile(join(evidence, "installed-tree.json"), npm(["ls", "--all", "--json"], consumer));
await writeFile(join(consumer, "host.tsx"), await readFile(join(root, "test/package-browser/lazy-host.tsx")));
const output = join(consumer, "public");
const bundled = await build({
  absWorkingDir: consumer, entryPoints: ["host.tsx"], outdir: output,
  bundle: true, splitting: true, format: "esm", platform: "browser", target: "es2022",
  jsx: "automatic", minify: true, metafile: true, define: { "process.env.NODE_ENV": '"production"' },
  entryNames: "host", chunkNames: "chunks/[name]-[hash]",
});
await writeFile(join(evidence, "metafile.json"), JSON.stringify(bundled.metafile, null, 2));
const outputs = new Map(Object.entries(bundled.metafile.outputs).map(([key, value]) => [resolve(consumer, key), value]));
const entry = [...outputs].find(([, value]) => value.entryPoint === "host.tsx")?.[0];
assert.ok(entry, "The browser host must be an emitted entry");
function reachable(includeDynamic) {
  const found = new Set(), queue = [entry];
  while (queue.length) {
    const file = queue.shift();
    if (found.has(file)) continue;
    found.add(file);
    for (const edge of outputs.get(file)?.imports ?? []) {
      if (!edge.external && (includeDynamic || edge.kind !== "dynamic-import")) queue.push(resolve(consumer, edge.path));
    }
  }
  return found;
}
const initial = reachable(false), all = reachable(true);
// A graph host may load the documented stylesheet up front. Only executable
// module bytes are the lazy-JavaScript boundary; report CSS separately below.
const graph = [...outputs].filter(([file, value]) => file.endsWith(".js") && Object.entries(value.inputs).some(([input, details]) =>
  details.bytesInOutput > 0 && !input.endsWith(".css") && /node_modules\/(?:@xyflow\/|dagre\/|graphlib\/)/.test(input)
)).map(([file]) => file);
const renderers = [...outputs].filter(([, value]) => Object.keys(value.inputs).some(input =>
  /node_modules\/footprint-explainable-ui\/dist\/TracedFlow-[^/]+\.js$/.test(input)
)).map(([file]) => file);
assert.ok(graph.length, "The browser fixture must actually include graph dependencies");
assert.ok(renderers.length, "The browser fixture must include the packed dynamic TracedFlow entry");
for (const file of new Set([...graph, ...renderers])) {
  assert.ok(all.has(file), `Graph output is not reachable: ${file}`);
  assert.ok(!initial.has(file), `Graph code leaked into the initial static closure: ${file}`);
}
const graphPaths = graph.map(file => `/${relative(output, file).split(sep).join("/")}`);
const rendererPaths = renderers.map(file => `/${relative(output, file).split(sep).join("/")}`);
await writeFile(join(output, "index.html"), '<!doctype html><html><head><meta charset="utf-8"><title>Lens lazy package proof</title><link rel="stylesheet" href="/host.css"><link rel="icon" href="data:,"></head><body><div id="root"></div><script type="module" src="/host.js"></script></body></html>');
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const file = resolve(output, `.${url.pathname === "/" ? "/index.html" : url.pathname}`);
    assert.ok(file.startsWith(`${output}${sep}`));
    const body = await readFile(file);
    response.writeHead(200, { "Content-Type": file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html", "Cache-Control": "no-store" });
    response.end(body);
  } catch {
    response.writeHead(404); response.end("Not found");
  }
});
await new Promise(resolveListening => server.listen(0, "127.0.0.1", resolveListening));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const requests = [], failures = [];
let releaseGraph;
const held = new Promise(resolveHeld => { releaseGraph = resolveHeld; });
try {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
  const context = await browser.newContext();
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    assert.equal(url.origin, origin, "Browser fixture must never contact an external service");
    requests.push(url.pathname);
    if (graphPaths.includes(url.pathname)) await held;
    await route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.on("pageerror", error => failures.push(error.message));
  page.on("console", message => { if (message.type() === "error") failures.push(message.text()); });
  page.on("requestfailed", request => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on("response", response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.goto(origin);
  await page.getByTestId("host-state").filter({ hasText: "old:0:light" }).waitFor();
  await page.locator('[data-fp="value-inspector"]').filter({ hasText: "old-first" }).waitFor();
  assert.ok(!requests.some(path => graphPaths.includes(path)), "Graph downloaded before it was opened");
  assert.ok(!requests.some(path => rendererPaths.includes(path)), "Renderer downloaded before it was opened");
  const lightBackground = await page.locator('[data-fp="value-inspector"]').evaluate(node => getComputedStyle(node).backgroundColor);
  await page.getByRole("button", { name: "Show graph", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Loading flowchart" }).waitFor();
  await page.getByRole("button", { name: "Switch recording", exact: true }).click();
  await page.getByRole("button", { name: "Switch step", exact: true }).click();
  await page.getByRole("button", { name: "Switch theme", exact: true }).click();
  await page.getByTestId("host-state").filter({ hasText: "new:1:dark" }).waitFor();
  releaseGraph();
  await page.locator('.react-flow__node[data-id="new-last"]').waitFor();
  await page.locator('.react-flow__node[data-id="new-last"]').getByText("NOW", { exact: true }).waitFor();
  assert.equal(await page.locator('.react-flow__node[data-id="new-first"]').getByText("NOW", { exact: true }).count(), 0);
  const assertCursorColor = async (stage) => assert.ok(await page.locator(`.react-flow__node[data-id="${stage}"]`).evaluate(node =>
    [...node.querySelectorAll("div")].some(element => getComputedStyle(element).backgroundColor === "rgb(18, 171, 52)")
  ), "Actual active node must use the updated cursor theme color");
  await assertCursorColor("new-last");
  await page.locator('[data-fp="value-inspector"]').filter({ hasText: "new-last" }).waitFor();
  assert.ok(requests.some(path => graphPaths.includes(path)), "No graph chunk was downloaded on opening");
  assert.equal(await page.locator('.react-flow__node[data-id="old-first"]').count(), 0);
  assert.notEqual(await page.locator('[data-fp="value-inspector"]').evaluate(node => getComputedStyle(node).backgroundColor), lightBackground);
  const beforeRemount = await page.locator('[data-fp="flowchart-panel"]').evaluate(node => getComputedStyle(node).backgroundColor);
  await page.getByRole("button", { name: "Hide graph", exact: true }).click();
  await page.getByRole("button", { name: "Show graph", exact: true }).click();
  await page.locator('.react-flow__node[data-id="new-last"]').waitFor();
  await page.locator('.react-flow__node[data-id="new-last"]').getByText("NOW", { exact: true }).waitFor();
  await assertCursorColor("new-last");
  assert.equal(await page.getByTestId("host-state").textContent(), "new:1:dark");
  assert.equal(await page.locator('[data-fp="flowchart-panel"]').evaluate(node => getComputedStyle(node).backgroundColor), beforeRemount);
  await page.locator('.react-flow__node[data-id="new-first"]').click();
  await page.locator('.react-flow__node[data-id="new-first"]').getByText("NOW", { exact: true }).waitFor();
  assert.equal(await page.locator('.react-flow__node[data-id="new-last"]').getByText("NOW", { exact: true }).count(), 0);
  await page.getByTestId("host-state").filter({ hasText: "new:0:dark" }).waitFor();
  await page.locator('[data-fp="value-inspector"]').filter({ hasText: "new-first" }).waitFor();
  await assertCursorColor("new-first");
  await page.screenshot({ path: join(evidence, "loaded.png"), fullPage: true });
  assert.deepEqual(failures, [], "Unexpected browser errors in the successful load scenario");
  await context.close();

  // Fresh module cache: actually fail the graph network request, not a mocked renderer.
  const broken = await browser.newContext();
  const aborted = [];
  await broken.route("**/*", async route => {
    const url = new URL(route.request().url());
    assert.equal(url.origin, origin);
    if (graphPaths.includes(url.pathname)) { aborted.push(url.pathname); await route.abort("failed"); }
    else await route.continue();
  });
  const brokenPage = await broken.newPage();
  brokenPage.setDefaultTimeout(15_000);
  await brokenPage.goto(origin);
  await brokenPage.getByRole("button", { name: "Show graph", exact: true }).click();
  await brokenPage.getByRole("alert", { name: "Graph unavailable" }).waitFor();
  assert.ok(aborted.length, "The failure case must actually abort a graph chunk request");
  await brokenPage.getByRole("button", { name: "Switch step", exact: true }).click();
  await brokenPage.locator('[data-fp="value-inspector"]').filter({ hasText: "old-last" }).waitFor();
  assert.equal(await brokenPage.getByTestId("host-state").textContent(), "old:1:light");
  await brokenPage.screenshot({ path: join(evidence, "failed.png"), fullPage: true });
  await broken.close();
  await writeFile(join(evidence, "verification.json"), JSON.stringify({
    passed: true, tarball: packed.filename, integrity: packed.integrity,
    initialOutputs: [...initial].map(file => relative(output, file)),
    reachableOutputs: [...all].map(file => relative(output, file)), graphPaths, rendererPaths, requests, aborted,
    stylesheet: "The host supplies XYFlow CSS up front; JavaScript renderer/vendor chunks are deferred.",
    checks: ["normal packed install", "no graph in static closure", "no initial graph request", "real lazy chunk request", "pending source/cursor/theme", "remount state", "accessible network failure", "other panels remain usable"],
    fixture: "synthetic mechanism fixture; real saved-run proof remains M8",
  }, null, 2));
  console.log(`Lazy packed browser checks passed: ${evidence}`);
} finally {
  releaseGraph();
  try { await browser?.close(); }
  finally { await new Promise(resolveClosed => server.close(resolveClosed)); }
}
