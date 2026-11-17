import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const checkout = process.argv[2];
if (!checkout) throw new Error('Pass the path to a built VizFootprint checkout.');
const manifest = resolve(checkout, 'package.json');
const requireFromViz = createRequire(manifest);
const viz = JSON.parse(readFileSync(manifest, 'utf8'));
const engine = requireFromViz('footprintjs/package.json');
const entry = requireFromViz.resolve('vizfootprint/analysis');
const { clusteringAnalysis } = await import(pathToFileURL(entry).href);
const rows = [5, 9, 42, 59].map(amount => ({ amount }));
const { result, snapshot } = await clusteringAnalysis({ column: 'amount', k: 2 }).run(rows);
if (!result.ok || !snapshot) throw new Error('The Viz analysis did not produce a recording.');

const { runId, initialState, executionTree, commitLog } = snapshot;
console.log(JSON.stringify({
  producer: { package: viz.name, version: viz.version, footprintjs: engine.version },
  sourceId: runId,
  source: { initialState, executionTree, commitLog },
}, null, 2));
