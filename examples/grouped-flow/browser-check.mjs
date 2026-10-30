/** Optional browser regression proof. Start the example server first; no installs or downloads. */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:5311');
assert(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) && !base.username && !base.password && base.pathname === '/' && !base.search && !base.hash, 'Use an HTTP loopback origin for the local example.');
const origin = base.origin;
const loaded = await import(process.env.GROUPED_FLOW_PLAYWRIGHT_MODULE ?? 'playwright');
const playwright = loaded.default ?? loaded;
const output = process.env.GROUPED_FLOW_REPORT_DIR ? resolve(process.env.GROUPED_FLOW_REPORT_DIR) : mkdtempSync(join(tmpdir(), 'grouped-flow-browser-'));
mkdirSync(output, { recursive: true });
const evidence = { browser: '', reducedMotion: true, blockedRequests: [], consoleErrors: [], pageErrors: [], checks: {}, screenshots: [] };
const browser = await playwright.chromium.launch({ headless: true, ...(process.env.GROUPED_FLOW_CHROMIUM_EXECUTABLE ? { executablePath: process.env.GROUPED_FLOW_CHROMIUM_EXECUTABLE } : {}), args: ['--disable-background-networking', '--disable-component-update', '--no-default-browser-check', '--disable-sync'] });
evidence.browser = browser.version();
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
const local = value => { const url = new URL(value); return ['http:', 'ws:'].includes(url.protocol) && url.hostname === base.hostname && url.port === base.port; };
await context.route('**/*', route => { if (local(route.request().url())) return route.continue(); evidence.blockedRequests.push(route.request().url()); return route.abort('blockedbyclient'); });
await context.routeWebSocket('**/*', socket => { if (local(socket.url())) return socket.connectToServer(); evidence.blockedRequests.push(socket.url()); socket.close(); });
const page = await context.newPage();
page.on('pageerror', error => evidence.pageErrors.push(error.message));
page.on('console', message => { if (message.type() === 'error') evidence.consoleErrors.push(message.text()); });
const snapshot = () => page.evaluate(() => ({
  nodes: [...document.querySelectorAll('[data-node-id]')].map(node => ({ id: node.getAttribute('data-node-id'), state: node.getAttribute('data-state'), highlighted: node.getAttribute('data-highlighted'), selected: node.getAttribute('data-selected'), expanded: node.getAttribute('data-expanded'), label: node.getAttribute('aria-label'), bounds: node.getBoundingClientRect().toJSON() })),
  edges: [...document.querySelectorAll('.react-flow__edge[data-id]')].map(edge => ({ id: edge.getAttribute('data-id'), className: edge.getAttribute('class'), label: edge.getAttribute('aria-label'), stroke: edge.querySelector('path')?.getAttribute('stroke') })),
  viewport: document.querySelector('.react-flow__viewport')?.getAttribute('style'),
  canvasBounds: document.querySelector('.react-flow')?.getBoundingClientRect().toJSON(),
  camera: (() => { const section = document.querySelector('section[data-camera-focus]'); return section ? { focus: section.getAttribute('data-camera-focus'), narrow: section.getAttribute('data-narrow'), direction: section.getAttribute('data-direction') } : null; })(),
  scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth,
}));
const capture = async name => {
  const path = join(output, `${name}.png`);
  const viewport = page.viewportSize();
  const height = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
  // Preserve width: some local Chromium builds briefly change media queries
  // during captureBeyondViewport. A taller viewport needs no full-page capture.
  if (viewport && height > viewport.height) await page.setViewportSize({ ...viewport, height });
  try { await page.screenshot({ path, fullPage: false }); }
  finally { if (viewport && height > viewport.height) await page.setViewportSize(viewport); }
  evidence.screenshots.push(path);
};
const contained = ids => page.waitForFunction(nodeIds => {
  const canvas = document.querySelector('.react-flow')?.getBoundingClientRect();
  return canvas && nodeIds.every(id => {
    const node = [...document.querySelectorAll('[data-node-id]')].find(element => element.getAttribute('data-node-id') === id)?.getBoundingClientRect();
    return node && node.width > 0 && node.left >= canvas.left - 1 && node.right <= canvas.right + 1 && node.top >= canvas.top - 1 && node.bottom <= canvas.bottom + 1;
  });
}, ids, { timeout: 5000 });
try {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.locator('[data-node-id="authorize1"]').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge[data-id]').length === 7);
  await contained(['cart1', 'payment1', 'authorize1', 'capture1', 'shipping1', 'rates1', 'failure1', 'label1', 'confirmation1']);
  assert.equal(await page.getByRole('heading', { name: 'A flow, with room for detail.' }).count(), 1);
  const initial = await snapshot();
  assert.deepEqual(initial.nodes.map(node => node.id).sort(), ['cart1', 'payment1', 'authorize1', 'capture1', 'shipping1', 'rates1', 'failure1', 'label1', 'confirmation1'].sort());
  assert.equal(initial.nodes.find(node => node.id === 'failure1').state, 'failed');
  assert.equal(initial.nodes.find(node => node.id === 'label1').state, 'not-run');
  assert.equal(initial.nodes.find(node => node.id === 'confirmation1').state, 'not-run');
  assert.deepEqual(initial.edges.map(edge => edge.id).sort(), ['cart-authorize', 'authorize-capture', 'capture-shipping', 'shipping-rates', 'rates-no', 'rates-yes', 'label-confirmation'].sort());
  assert.deepEqual(initial.edges.filter(edge => edge.className.includes('gfd-edge-not-taken')).map(edge => edge.id).sort(), ['rates-yes', 'label-confirmation'].sort());
  evidence.checks.initial = initial;
  await capture('desktop-expanded');
  await page.getByRole('button', { name: 'Select Cart', exact: true }).click();
  assert.equal(await page.locator('#selected-step-title').textContent(), 'Cart');
  await page.getByRole('button', { name: /Trace this problem/ }).click();
  assert.equal(await page.locator('#selected-step-title').textContent(), 'No shipping option');
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge.gfd-edge-highlighted').length === 2);
  const highlighted = await snapshot();
  assert.deepEqual(highlighted.nodes.filter(node => node.highlighted === 'true').map(node => node.id).sort(), ['shipping1', 'rates1', 'failure1'].sort());
  assert.equal(highlighted.nodes.find(node => node.id === 'failure1').selected, 'true');
  assert.deepEqual(highlighted.edges.filter(edge => edge.className.includes('gfd-edge-highlighted')).map(edge => edge.id).sort(), ['shipping-rates', 'rates-no'].sort());
  evidence.checks.highlighted = highlighted;
  await capture('desktop-highlighted');
  await page.getByRole('button', { name: 'Collapse Payment', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('[data-node-id="authorize1"]'));
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge[data-id]').length === 6);
  await page.getByRole('button', { name: 'Expand Payment', exact: true }).click();
  await page.locator('[data-node-id="authorize1"]').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge[data-id]').length === 7);
  evidence.checks.mouseGroupControls = true;
  const collapse = page.getByRole('button', { name: 'Collapse Payment', exact: true });
  await collapse.focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('[data-node-id="authorize1"]'));
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge[data-id]').length === 6);
  const collapsed = await snapshot();
  assert(!collapsed.nodes.some(node => ['authorize1', 'capture1'].includes(node.id)));
  assert.equal(collapsed.nodes.find(node => node.id === 'payment1').state, 'completed');
  assert.deepEqual(collapsed.edges.map(edge => edge.id).sort(), ['cart-authorize', 'capture-shipping', 'shipping-rates', 'rates-no', 'rates-yes', 'label-confirmation'].sort());
  evidence.checks.keyboardCollapsed = collapsed;
  await capture('desktop-collapsed');
  const expand = page.getByRole('button', { name: 'Expand Payment', exact: true });
  await expand.focus(); await page.keyboard.press('Space');
  await page.locator('[data-node-id="authorize1"]').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge[data-id]').length === 7);
  assert.equal((await snapshot()).nodes.find(node => node.id === 'authorize1').state, 'completed');
  evidence.checks.keyboardExpansion = true;
  assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
  for (const name of [/^zoom in$/i, /^zoom out$/i, /^Fit diagram$/]) assert.equal(await page.getByRole('button', { name }).count(), 1, `${name} control is labelled.`);
  await page.getByRole('button', { name: /^zoom in$/i }).focus();
  const beforeZoom = (await snapshot()).viewport;
  await page.evaluate(() => {
    window.__gfdZoomSamples = [];
    let frames = 0;
    const sample = () => { window.__gfdZoomSamples.push(document.querySelector('.react-flow__viewport')?.getAttribute('style')); if (++frames < 16) requestAnimationFrame(sample); };
    requestAnimationFrame(sample);
  });
  await page.keyboard.press('Enter');
  await page.waitForFunction(previous => document.querySelector('.react-flow__viewport')?.getAttribute('style') !== previous, beforeZoom);
  await page.waitForFunction(() => window.__gfdZoomSamples.length === 16);
  const afterZoom = (await snapshot()).viewport;
  assert.notEqual(afterZoom, beforeZoom, 'Keyboard zoom must change the viewport.');
  const zoomSamples = await page.evaluate(() => window.__gfdZoomSamples);
  assert(new Set(zoomSamples).size <= 2, 'Reduced-motion zoom must settle without intermediate animated transforms.');
  evidence.checks.reducedMotion = { preference: true, distinctZoomFrameTransforms: new Set(zoomSamples).size, sampledFrames: zoomSamples.length };
  await page.getByRole('button', { name: 'Fit diagram', exact: true }).focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(previous => document.querySelector('.react-flow__viewport')?.getAttribute('style') !== previous, afterZoom);
  evidence.checks.keyboardViewportControls = { beforeZoom, afterZoom, afterFit: (await snapshot()).viewport };
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => (document.querySelector('[data-node-id="failure1"]')?.getBoundingClientRect().width ?? 0) >= 140);
    await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge[data-id]').length === 7);
    const mobile = await snapshot();
    assert(mobile.scrollWidth <= mobile.innerWidth, `Page overflow at ${width}: ${mobile.scrollWidth}`);
    const selectedBounds = await page.locator('[data-node-id="failure1"]').boundingBox();
    assert(selectedBounds && selectedBounds.width >= 140, `Selected step must be readable at ${width}.`);
    evidence.checks[`mobile${width}`] = { ...mobile, selectedBounds };
    await capture(`mobile-${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto(`${origin}/nested.html`, { waitUntil: 'networkidle' });
  await page.locator('[data-node-id="pay-a"]').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge[data-id]').length === 1);
  await contained(['order', 'pay-a', 'pay-b']);
  let nested = await snapshot();
  assert.deepEqual(nested.nodes.map(node => node.id).sort(), ['order', 'pay-a', 'pay-b'].sort());
  assert(nested.nodes.every(node => node.state === 'unknown'), 'Child observations must not invent group states.');
  assert.deepEqual(nested.edges.map(edge => edge.id), ['a2-b1']);
  assert.match(nested.edges[0].label, /Grouped view of the original relationship/);
  assert.match(await page.locator('[data-node-id="pay-b"]').textContent(), /1 recorded issue inside/);
  await page.getByRole('button', { name: 'Expand Payment · Group 2', exact: true }).click();
  await page.locator('[data-node-id="a2"]').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge[data-id]').length === 2);
  await contained(['order', 'pay-a', 'pay-b', 'a1', 'a2']);
  assert.equal(await page.locator('[data-node-id="b1"]').count(), 0, 'Expanding one instance must leave its sibling closed.');
  await page.getByRole('button', { name: 'Select Validate · Group 2 · Item 5', exact: true }).click();
  assert.equal(await page.locator('output').getAttribute('data-selected-id'), 'a2');
  await page.getByRole('button', { name: 'Expand Payment · Group 3', exact: true }).focus(); await page.keyboard.press('Enter');
  await page.locator('[data-node-id="b1"]').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge[data-id]').length === 2);
  await contained(['order', 'pay-a', 'pay-b', 'a1', 'a2', 'b1']);
  await page.getByRole('button', { name: 'Select Validate · Group 3', exact: true }).click();
  assert.equal(await page.locator('output').getAttribute('data-selected-id'), 'b1');
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge[data-id]').length === 2);
  nested = await snapshot();
  assert.equal(nested.nodes.find(node => node.id === 'a2').state, 'completed');
  assert.equal(nested.nodes.find(node => node.id === 'b1').state, 'failed');
  assert.equal(nested.nodes.find(node => node.id === 'pay-b').state, 'unknown');
  assert.deepEqual(nested.edges.map(edge => edge.id).sort(), ['a1-a2', 'a2-b1'].sort());
  assert(nested.edges.every(edge => edge.className.includes('gfd-edge-observed')));
  evidence.checks.nestedExpanded = nested;
  await capture('nested-expanded');
  await page.getByRole('button', { name: 'Collapse Payment · Group 2', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('[data-node-id="a2"]'));
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge[data-id]').length === 1);
  nested = await snapshot();
  assert.equal(nested.nodes.find(node => node.id === 'b1').selected, 'true');
  assert.deepEqual(nested.edges.map(edge => edge.id), ['a2-b1']);
  assert.match(nested.edges[0].label, /Grouped view of the original relationship/);
  evidence.checks.nestedCollapsedProxy = nested;
  await capture('nested-collapsed-proxy');
  await page.getByRole('button', { name: 'Collapse Order', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-node-id]').length === 1);
  assert.equal((await snapshot()).nodes[0].state, 'unknown');
  await page.getByRole('button', { name: 'Reveal selection', exact: true }).click();
  await page.locator('[data-node-id="b1"]').waitFor();
  assert.equal(await page.locator('output').getAttribute('data-selected-id'), 'b1');
  assert.equal((await snapshot()).nodes.find(node => node.id === 'b1').selected, 'true');
  evidence.checks.nestedRevealSelection = true;
  assert.deepEqual(evidence.pageErrors, []);
  assert.deepEqual(evidence.consoleErrors, []);
  assert.deepEqual(evidence.blockedRequests, []);
  evidence.passed = true;
} catch (error) {
  evidence.passed = false; evidence.error = error.stack; evidence.failureSnapshot = await snapshot().catch(() => null); await capture('failure'); throw error;
} finally {
  writeFileSync(join(output, 'verification.json'), JSON.stringify(evidence, null, 2) + '\n');
  await browser.close();
}
console.log(JSON.stringify({ passed: evidence.passed, browser: evidence.browser, checks: Object.keys(evidence.checks), screenshots: evidence.screenshots }));
