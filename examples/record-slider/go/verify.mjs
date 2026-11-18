// Explicit Node 22 CI check. Building or viewing the example only needs its saved JSON.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRecordLensReader } from 'footprint-explainable-ui/record';
import { sliceToJSON } from 'foottrace';

const sourceFile = fileURLToPath(new URL('./main.go', import.meta.url));
const emitted = execFileSync('go', ['run', sourceFile], { encoding: 'utf8' });
assert.equal(emitted, readFileSync(new URL('./invoice.json', import.meta.url), 'utf8'));

const reader = createRecordLensReader({ sourceId: 'invoice', source: JSON.parse(emitted) });
assert.deepEqual(reader.stops.map(stop => stop.kind), ['start', 'commit', 'commit', 'end']);
const subtotal = reader.at(1, ['subtotal']);
assert.equal(subtotal.status, 'ready');
assert.equal(subtotal.folded.state.subtotal, 30);
assert.equal(subtotal.provenance.slice.writer.runtimeStageId, 'subtotal#0');
const invoice = reader.at(2, ['invoiceTotal']);
assert.equal(invoice.status, 'ready');
assert.equal(invoice.folded.state.invoiceTotal, 35);
const explanation = sliceToJSON(invoice.provenance.slice);
assert.equal(explanation.writerId, 'invoice#1');
assert.ok(explanation.edges.some(edge =>
  edge.from === 'invoice#1' && edge.to === 'subtotal#0' && edge.key === 'subtotal'
));
console.log('Go emitted the exact saved invoice; the built reader recovered its four stops and subtotal writer.');
