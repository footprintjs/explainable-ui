/** Offline public-package SSR check. Build first; scratch files are always removed. */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repo = fileURLToPath(new URL("../", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "isometric-package-"));
const env = { ...process.env, CI: "true", npm_config_offline: "true", npm_config_cache: join(scratch, "npm-cache") };
function run(command, args, cwd = scratch) {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  return result.stdout;
}

try {
  const packed = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", scratch], repo));
  const modules = join(scratch, "node_modules"), destination = join(modules, "footprint-explainable-ui");
  mkdirSync(destination, { recursive: true });
  run("tar", ["-xzf", join(scratch, packed[0].filename), "--strip-components=1", "-C", destination]);
  const manifest = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
  for (const name of new Set([...Object.keys(manifest.peerDependencies), ...Object.keys(manifest.dependencies)])) {
    mkdirSync(dirname(join(modules, name)), { recursive: true });
    symlinkSync(join(repo, "node_modules", name), join(modules, name), "dir");
  }
  const consumer = `
const assert = require("node:assert/strict");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { ReactFlowProvider, Position } = xyflow;
const Icon = React.forwardRef(({ name, children: _children, ...props }, ref) => React.createElement("span", { ...props, ref, "data-company-icon": name }, "Company icon"));
for (const name of ["TraceFlow", "TracedFlow", "IsometricStageNode", "IsometricEdge", "IsometricGrid", "FootprintTheme"]) assert.equal(typeof api[name], "function", name);
const reader = api.createDiagramAppearanceReader([
  { step: 1, target: "node", id: "stage", appearance: { activity: "updating", progress: { completed: 0, total: 2 } } },
  { step: 3, target: "node", id: "stage", appearance: { presence: "removed" } },
]);
assert.equal(reader.at(3).nodes.stage.presence, "removed");
assert.equal(reader.at(2).nodes.stage.progress.completed, 0);
assert.equal(reader.at(0).nodes.stage, undefined);
const node = React.createElement(ReactFlowProvider, null,
  React.createElement(api.FootprintTheme, { components: { Icon }, tokens: { nodes: { borderColor: "#123456" } } },
    React.createElement(api.IsometricStageNode, { data: { label: "Recorded stage", description: "Saved description", icon: "company-stage", active: true } })));
const html = renderToStaticMarkup(node);
assert.match(html, /data-company-icon="company-stage"/);
assert.match(html, /width:168px/);
assert.match(html, /height:116px/);
assert.match(html, /Recorded stage. Saved description. Selected step/);
assert.match(html, /--fp-node-border-color:#123456/);
const graph = { nodes: [{ id: "stage", type: "stage", position: { x: 0, y: 0 },
  style: { width: 168, height: 116 }, data: { label: "Packaged stage", icon: "company-stage", isDecider: false, isFork: false, isStreaming: false, isSubflow: false, prevIds: [], nextIds: [] } }], edges: [] };
for (const name of ["TraceFlow", "TracedFlow"]) {
  const chart = renderToStaticMarkup(React.createElement(api.FootprintTheme, { components: { Icon } },
    React.createElement(api[name], { graph, renderer: "isometric", layout: "passthrough", ...(name === "TracedFlow" ? { autoFit: false } : {}) })));
  assert.match(chart, /data-fp="isometric-stage-node"/);
  assert.match(chart, /data-company-icon="company-stage"/);
}
const edge = renderToStaticMarkup(React.createElement("svg", null, React.createElement(api.IsometricEdge, {
  id: "recorded-edge", source: "a", target: "b", sourceX: 10, sourceY: 20, targetX: 100, targetY: 80,
  sourcePosition: Position.Right, targetPosition: Position.Left, markerEnd: "url(#host-arrow)", style: { stroke: "purple" },
})));
assert.match(edge, /marker-end="url\\(#host-arrow\\)"/);
assert.match(edge, /stroke:purple/);
process.stdout.write(format + " public isometric SSR passed; Icon adapter, tokens, geometry and edge markers preserved.\\n");
`;
  writeFileSync(join(scratch, "consumer.cjs"), 'const format = "CJS";\nconst api = require("footprint-explainable-ui/flowchart");\nconst xyflow = require("@xyflow/react");\n' + consumer);
  process.stdout.write(run(process.execPath, [join(scratch, "consumer.cjs")]));
  writeFileSync(join(scratch, "consumer.mjs"), 'import { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\nconst format = "ESM";\nconst api = await import("footprint-explainable-ui/flowchart");\nconst xyflow = await import("@xyflow/react");\n' + consumer);
  process.stdout.write(run(process.execPath, [join(scratch, "consumer.mjs")]));
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
