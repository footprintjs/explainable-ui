const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
module.exports = async function verify(api, flowchart, format) {
  assert.equal(typeof api.investigationGapMessage, 'function');
  assert.equal(api.investigationGapMessage('not-collected'), 'Some evidence was not collected.');
  for (const value of ['unknown', 'toString', '__proto__', 'x'.repeat(10000), null, 1,
    { toString() { throw Error('No coercion'); } }]) assert.equal(api.investigationGapMessage(value), undefined);
  assert(!Object.hasOwn(flowchart, 'investigationGapMessage'));
  for (const door of [api, flowchart]) for (const key of ['gapMessages', 'attentionNames', 'resolveInvestigationMarkLabel']) assert(!Object.hasOwn(door, key));
  const marks = ['error', 'custom-kind'].map(kind => ({ kind, reason: 'ERROR_RECORDED', evidence: [] }));
  const attention = { nodes: [{ nodeId: 'selection', attention: marks }], confidence: 'complete', gaps: [] };
  let calls = 0, signal;
  const port = { binding: {}, attention, explain(nodeId, context) {
    calls++; signal = context.signal; assert.equal(nodeId, 'selection');
    return { nodeId, attention: marks, path: [nodeId], alternatives: [], confidence: 'incomplete', gaps: [],
      impact: { nodes: [], confidence: 'complete', gaps: [] } };
  } };
  const before = JSON.stringify(attention);
  const render = markLabels => renderToStaticMarkup(React.createElement(api.InvestigationPanel, { port, markLabels }));
  const ordinary = render(); assert(ordinary.includes('Recorded error')); assert(ordinary.includes('custom-kind'));
  let reads = 0;
  const labels = new Proxy({ error: 'error', 'custom-kind': '<Host label>' }, {
    getOwnPropertyDescriptor(target, key) { reads++; return Reflect.getOwnPropertyDescriptor(target, key); },
    ownKeys() { throw Error('Do not enumerate'); }, get() { throw Error('Do not read getters'); },
  });
  const custom = render(labels); assert.equal(reads, 2); assert(!custom.includes('Recorded error'));
  assert(custom.includes('&lt;Host label&gt;')); assert(!custom.includes('<Host label>'));
  for (const labels of [Object.create({ error: 'Inherited' }), { get error() { throw Error('No getter'); } },
    { error: '' }, { error: 'x'.repeat(513) }, { error: 7 },
    new Proxy({}, { getOwnPropertyDescriptor() { throw new Proxy({}, { get() { throw Error('Do not inspect errors'); } }); } })]) {
    assert(render(labels).includes('Recorded error'));
  }
  assert(render({ error: 'x'.repeat(512) }).includes('x'.repeat(512)));
  assert.equal(calls, 0); assert.equal(JSON.stringify(attention), before);

  // Exercise the real packed component's selected-result badge and update path.
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
  global.window = dom.window; global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement; global.Element = dom.window.Element;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.Element.prototype.scrollIntoView = () => {};
  const { createRoot } = require('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(api.InvestigationPanel, { port, markLabels: { error: 'Before host', 'custom-kind': 'Before custom' } })));
    const investigate = document.querySelector('button[aria-label="Investigate item 1"]');
    assert(investigate);
    await React.act(async () => investigate.click());
    assert.equal(calls, 1); assert(!signal.aborted);
    assert(document.body.textContent.includes('Before host')); assert(document.body.textContent.includes('Before custom'));
    const focus = document.activeElement;
    await React.act(async () => root.render(React.createElement(api.InvestigationPanel, { port, markLabels: { error: 'After host', 'custom-kind': 'After custom' } })));
    assert(document.body.textContent.includes('After host')); assert(document.body.textContent.includes('After custom'));
    assert(!document.body.textContent.includes('Before host')); assert.equal(calls, 1); assert(!signal.aborted);
    assert.equal(document.activeElement, focus);
  } finally { await React.act(async () => root.unmount()); dom.window.close(); }
  process.stdout.write(format + ' actual packed sentence lookup, root-only boundary, host badges and focused replacement passed.\n');
};
