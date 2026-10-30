/** Optional local browser proof. Uses an existing Playwright/browser installation only. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:5312');
assert(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) && base.port === '5312' && base.pathname === '/' && !base.username && !base.password && !base.search && !base.hash, 'Use the new loopback investigation preview on port5312.');
const loaded = await import(process.env.GROUPED_FLOW_PLAYWRIGHT_MODULE ?? 'playwright');
const playwright = loaded.default ?? loaded;
const report = process.env.GROUPED_FLOW_REPORT_DIR ? resolve(process.env.GROUPED_FLOW_REPORT_DIR) : mkdtempSync(join(tmpdir(), 'grouped-investigation-browser-'));
mkdirSync(report, { recursive: true });
const native = process.env.GROUPED_INVESTIGATION_EXPECTED_RESULTS ? JSON.parse(readFileSync(process.env.GROUPED_INVESTIGATION_EXPECTED_RESULTS, 'utf8')) : undefined;
if (native) assert.equal(createHash('sha256').update(readFileSync(new URL('./recorded.ts', import.meta.url))).digest('hex'), native.fixtureSHA256, 'Canonical reference must match this fixture.');
const evidence = { passed: false, browser: '', reference: native ? 'Archive-validated native ESM/CJS fixture' : 'Native public fixture export', candidateSHA256: native?.candidateSHA256, checks: {}, screenshots: [], blockedRequests: [], pageErrors: [], consoleErrors: [] };
const browser = await playwright.chromium.launch({ headless: true, ...(process.env.GROUPED_FLOW_CHROMIUM_EXECUTABLE ? { executablePath: process.env.GROUPED_FLOW_CHROMIUM_EXECUTABLE } : {}) });
evidence.browser = browser.version();
const context = await browser.newContext({ viewport: { width: 1440, height: 1200 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
const local = value => { const url = new URL(value); return ['http:', 'ws:'].includes(url.protocol) && url.hostname === base.hostname && url.port === base.port; };
await context.route('**/*', route => { if (local(route.request().url())) return route.continue(); evidence.blockedRequests.push(route.request().url()); return route.abort('blockedbyclient'); });
await context.routeWebSocket('**/*', socket => { if (local(socket.url())) return socket.connectToServer(); evidence.blockedRequests.push(socket.url()); socket.close(); });
const page = await context.newPage();
page.on('pageerror', error => evidence.pageErrors.push(error.message));
page.on('console', message => { if (message.type() === 'error') evidence.consoleErrors.push(message.text()); });
const settle = () => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const snapshot = () => page.evaluate(() => ({
  nodes: [...document.querySelectorAll('[data-node-id]')].map(node => ({ id: node.getAttribute('data-node-id'), state: node.getAttribute('data-state'), selected: node.getAttribute('data-selected'), highlighted: node.getAttribute('data-highlighted'), bounds: node.getBoundingClientRect().toJSON() })),
  geometry: [...document.querySelectorAll('.react-flow__node[data-id]')].map(node => ({ id: node.getAttribute('data-id'), transform: node.style.transform, width: node.style.width, height: node.style.height })).sort((a,b) => a.id.localeCompare(b.id)),
  design: [...document.querySelectorAll('.react-flow__edge[data-id]')].filter(edge => !edge.classList.contains('gfd-recorded-relationship')).map(edge => ({ id: edge.getAttribute('data-id'), className: edge.getAttribute('class'), path: edge.querySelector('.react-flow__edge-path')?.getAttribute('d') })).sort((a,b) => a.id.localeCompare(b.id)),
  relationships: [...document.querySelectorAll('.gfd-recorded-relationship[data-id]')].map(edge => ({ id: edge.getAttribute('data-id'), label: edge.getAttribute('aria-label') })),
  viewport: document.querySelector('.react-flow__viewport')?.getAttribute('style'), width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
  calls: Number(document.querySelector('[data-testid="analysis-count"]')?.textContent),
}));
const capture = async name => {
  const path = join(report, `${name}.png`), viewport = page.viewportSize();
  const height = await page.evaluate(() => Math.ceil(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)));
  if (viewport && height > viewport.height) await page.setViewportSize({ ...viewport, height });
  try { await page.screenshot({ path, fullPage: false }); } finally { if (viewport && height > viewport.height) await page.setViewportSize(viewport); }
  evidence.screenshots.push(path);
};
const edgeCount = count => page.waitForFunction(n => document.querySelectorAll('.gfd-recorded-relationship').length === n, count);
const designCount = count => page.waitForFunction(n => [...document.querySelectorAll('.react-flow__edge[data-id]')].filter(edge => !edge.classList.contains('gfd-recorded-relationship')).length === n, count);
const calls = async expected => { await page.waitForFunction(n => Number(document.querySelector('[data-testid="analysis-count"]')?.textContent) === n, expected); assert.equal((await snapshot()).calls, expected); };
const markerCheck = async (expected, scrollBefore) => {
  const root = expected.result.rootCause;
  const markers = await page.evaluate(rootId => {
    const summary = document.querySelector('[role="status"][aria-label="Cause summary"]');
    const canvas = document.querySelector('.react-flow');
    const roots = [...document.querySelectorAll('[data-node-id]')].flatMap(node => [...node.querySelectorAll('span')].filter(span => span.textContent?.trim() === 'Supported cause').map(span => ({ id: node.getAttribute('data-node-id'), state: node.getAttribute('data-state'), bounds: span.getBoundingClientRect().toJSON() })));
    const rootCard = [...document.querySelectorAll('[data-node-id]')].find(node => node.getAttribute('data-node-id') === rootId);
    return { roots, ancestorMarkers: [...document.querySelectorAll('[data-node-id] span')].filter(span => span.textContent?.trim() === 'Cause inside').length, summary: summary?.textContent, summaryBounds: summary?.getBoundingClientRect().toJSON(), canvasBounds: canvas?.getBoundingClientRect().toJSON(), rootBounds: rootCard?.getBoundingClientRect().toJSON(), summaryBeforeCanvas: !!(summary && canvas && (summary.compareDocumentPosition(canvas) & Node.DOCUMENT_POSITION_FOLLOWING)), activeLabel: document.activeElement?.getAttribute('aria-label'), focusInExplanation: !!document.activeElement?.closest('[role="region"][aria-label="Selected explanation"]'), scrollY, height: innerHeight };
  }, root);
  assert(markers.summaryBeforeCanvas, 'Cause summary must precede the diagram.');
  assert.equal(markers.focusInExplanation, false, 'A canvas gesture must not focus the lower explanation panel.');
  if (scrollBefore !== undefined) {
    assert(Math.abs(markers.scrollY - scrollBefore) <= 2, 'Analysis must preserve the page position after the diagram gesture.');
    assert.equal(markers.activeLabel, 'Select No shipping option', 'Keyboard focus must stay on the selected failure card.');
    assert(markers.summaryBounds.top >= -2 && markers.summaryBounds.bottom <= markers.height, 'The cause summary must remain in the viewport after the failure gesture.');
  }
  if (root) {
    assert.deepEqual(markers.roots.map(marker => marker.id), [root], 'Only the exact admitted root card may carry Supported cause.');
    assert.equal(markers.roots[0].state, 'completed', 'Cause emphasis must preserve the recorded Completed execution state.');
    assert.match(markers.summary, /Supported cause: Shipping rates/);
    const badge = markers.roots[0].bounds, canvas = markers.canvasBounds;
    assert(badge.top >= canvas.top && badge.bottom <= canvas.bottom && badge.left >= canvas.left && badge.right <= canvas.right, 'Supported cause badge must remain inside the visible canvas.');
    if (scrollBefore !== undefined) assert(badge.top >= 0 && badge.bottom <= markers.height, 'Supported cause badge must remain in the page viewport.');
  } else {
    assert.deepEqual(markers.roots, []); assert.equal(markers.ancestorMarkers, 0);
    assert.match(markers.summary, /Cause unknown/);
  }
  return markers;
};
const prepareGesture = async () => {
  await page.getByRole('status', { name: 'Cause summary', exact: true }).evaluate(element => element.scrollIntoView({ block: 'start' }));
  await page.getByRole('button', { name: 'Select No shipping option', exact: true }).focus();
  return page.evaluate(() => scrollY);
};
const unchangedDesign = (actual, expected) => {
  assert.deepEqual(actual.map(({id,className})=>({id,className})), expected.map(({id,className})=>({id,className})));
  let maxCoordinateDrift = 0;
  for (let index=0;index<actual.length;index++) {
    // ReactFlow derives handle coordinates from transformed DOM rectangles.
    // Scrolling can change their floating-point serialization by subpixels.
    const tokens = path => path.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g);
    const left=tokens(actual[index].path),right=tokens(expected[index].path);
    assert.equal(left.length,right.length,'Design path commands must stay unchanged.');
    for(let token=0;token<left.length;token++) {
      if (/^[a-zA-Z]$/.test(left[token])) assert.equal(left[token],right[token]);
      else { const drift=Math.abs(Number(left[token])-Number(right[token]));assert(drift<=.001,'Design path coordinates must stay within .001 diagram pixels.');maxCoordinateDrift=Math.max(maxCoordinateDrift,drift); }
    }
  }
  return {maxCoordinateDrift,tolerance:.001};
};
const desktopFraming = async () => {
  await page.waitForFunction(() => {
    const canvas=document.querySelector('.react-flow')?.getBoundingClientRect(), group=document.querySelector('[data-node-id="delivery-group"]');
    const collapse=group?.querySelector('button')?.getBoundingClientRect();
    const title=[...group?.querySelectorAll('*')??[]].find(element=>element.children.length===0&&element.textContent?.trim()==='Delivery checks')?.getBoundingClientRect();
    return canvas&&collapse&&title&&[collapse,title].every(box=>box.left>=canvas.left&&box.right<=canvas.right&&box.top>=canvas.top&&box.bottom<=canvas.bottom);
  });
  await page.getByRole('button',{name:'Collapse Delivery checks',exact:true}).click({trial:true});
  const labels=await page.evaluate(()=>{
    const no=[...document.querySelectorAll('.react-flow__edge-text')].find(node=>node.textContent==='No')?.getBoundingClientRect();
    return{no:no?.toJSON(),recorded:[...document.querySelectorAll('[data-relationship-id]')].map(node=>({id:node.getAttribute('data-relationship-id'),text:node.textContent,bounds:node.getBoundingClientRect().toJSON(),title:node.getAttribute('title')}))};
  });
  assert(labels.no);assert.equal(labels.recorded.length,3);
  for(const label of labels.recorded){const a=label.bounds,b=labels.no;assert(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),'Recorded caption must not overlap the design No caption.');assert(label.title?.includes('Per-write'));}
  return labels;
};
const relationshipsMatch = async result => {
  await edgeCount(result.backward.edges.length); await settle();
  const points = await page.evaluate(edges => edges.map((edge, index) => {
    const rendered = [...document.querySelectorAll('.gfd-recorded-relationship')].find(element => element.getAttribute('data-id') === `recorded-dependency:${index}`);
    const path = rendered?.querySelector('.react-flow__edge-path'), matrix = path?.getScreenCTM();
    const endpoint = (id, handle) => { const node = [...document.querySelectorAll('[data-node-id]')].find(item => item.getAttribute('data-node-id') === id); const box = node?.querySelector(`[data-handleid="${handle}"]`)?.getBoundingClientRect(); return box?.toJSON() ?? null; };
    const point = distance => { if (!path || !matrix) return null; const p = path.getPointAtLength(distance); return new DOMPoint(p.x,p.y).matrixTransform(matrix).toJSON(); };
    return { from: edge.from, to: edge.to, start: point(0), end: point(path?.getTotalLength() ?? 0), source: endpoint(edge.from,'dependency-source'), target: endpoint(edge.to,'dependency-target'), label: rendered?.getAttribute('aria-label') };
  }), result.backward.edges);
  evidence.currentRelationshipPoints = points;
  const touches = (point,handle) => point.x>=handle.left-2 && point.x<=handle.right+2 && point.y>=handle.top-2 && point.y<=handle.bottom+2;
  for (const edge of points) {
    assert(edge.start && edge.end && edge.source && edge.target, 'Recorded edge must have both declared handles.');
    assert(touches(edge.start,edge.source), 'Arrow source must touch the canonical dependent handle.');
    assert(touches(edge.end,edge.target), 'Arrow target must touch the canonical recorded parent handle.');
    assert.match(edge.label, /Per-write link[.] data dependency/);
  }
  return points;
};
try {
  await page.goto(base.origin, { waitUntil: 'networkidle' });
  const cases = native?.cases ?? await page.evaluate(async () => { const module = await import('/recorded.ts'); const output = {}; for (const name of ['complete','missing','ambiguous']) { const sample=module.createRecordedInvestigationExample(name); output[name]={ids:sample.ids,definition:sample.definition,observation:sample.observation,result:await sample.port.explain(sample.ids.failure,{signal:new AbortController().signal})}; } return output; });
  for (const name of ['complete','missing','ambiguous']) {
    const expected = cases[name]; assert(expected.result.backward, 'Native reader must provide backward evidence.');
    if (name !== 'complete') await page.getByLabel('Recording to inspect', { exact:true }).selectOption(name);
    await calls(0); await page.getByRole('button',{name:'Select No shipping option',exact:true}).waitFor();
    assert.equal(await page.getByText('Supported cause',{exact:true}).count(),0,'A fresh recording must not retain the previous root marker.');
    assert.equal(await page.getByText('Cause inside',{exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:'Expand Payment',exact:true}).count(),1);
    if (name === 'complete') {
      await page.getByRole('button',{name:'Select Cart',exact:true}).focus(); await page.keyboard.press('Enter'); await calls(0);
      await page.getByRole('button',{name:'Expand Delivery checks',exact:true}).focus(); await page.keyboard.press('Enter'); await designCount(8); await settle();
      evidence.checks.unadornedExpandedGeometry = await snapshot();
      await page.getByRole('button',{name:'Collapse Delivery checks',exact:true}).click(); await designCount(6);
    }
    const scrollBefore = await prepareGesture();
    await page.getByRole('button',{name:'Select No shipping option',exact:true}).click();
    await page.getByRole('heading',{name:name==='complete'?'Supported root cause':'Root cause unknown',exact:true}).waitFor(); await calls(1);
    assert.equal(await page.getByRole('button',{name:'Expand Payment',exact:true}).count(),1);
    assert.equal(await page.getByRole('button',{name:'Collapse Delivery checks',exact:true}).count(),1);
    const points = await relationshipsMatch(expected.result), view = await snapshot();
    const markers = await markerCheck(expected, scrollBefore);
    const framing=await desktopFraming();
    const groups=new Set(expected.definition.nodes.filter(node=>node.kind==='group').map(node=>node.id));
    assert.deepEqual(view.nodes.filter(node=>node.highlighted==='true'&&!groups.has(node.id)).map(node=>node.id).sort(), [...new Set(expected.result.backward.nodes)].sort());
    assert.deepEqual(view.nodes.filter(node=>node.highlighted==='true'&&groups.has(node.id)).map(node=>node.id),['delivery-group']);
    assert.equal(view.nodes.find(node=>node.id==='delivery-group').state,'unknown');
    assert.equal(view.nodes.find(node=>node.id==='payment-group').state,'unknown');
    assert.equal(view.nodes.find(node=>node.id===expected.ids.failure).selected,'true');
    assert(view.design.every(edge=>edge.id.startsWith('design:') && !edge.className.includes('gfd-edge-highlighted')));
    const detail=page.locator('details').filter({has:page.locator('summary').filter({hasText:'Recorded dependency evidence'})});
    assert.equal(await detail.count(),1);
    const evidenceText=await detail.textContent();
    for(const edge of expected.result.backward.edges)for(const reference of edge.evidence)assert(evidenceText.includes(reference),'Returned edge evidence must remain inspectable.');
    if(name==='complete') { assert.equal(expected.result.rootCause,expected.ids.shipping); assert.match(await page.getByRole('region',{name:'Selected explanation'}).textContent(),/Shipping rates/); assert.deepEqual(view.geometry,evidence.checks.unadornedExpandedGeometry.geometry); evidence.checks.designGeometry=unchangedDesign(view.design,evidence.checks.unadornedExpandedGeometry.design); }
    else { assert.equal(expected.result.rootCause,undefined); assert.equal(await page.getByRole('heading',{name:'Supported root cause',exact:true}).count(),0); if(name==='missing')assert.equal(await page.getByText(/Some evidence is missing/).count(),1); else assert(expected.result.alternatives.length>1); }
    evidence.checks[name]={...view,canonicalEdges:expected.result.backward.edges,renderedEndpoints:points,framing,markers};
    await capture(`desktop-${name}-cause`);
    await page.getByRole('button',{name:'What it affected',exact:true}).focus(); await page.keyboard.press('Space'); await edgeCount(expected.result.impact.edges.length); await calls(1);
    assert.equal(await page.getByText('Supported cause',{exact:true}).count(),0,'Impact view must not label an unrelated root.');
    await page.getByRole('button',{name:'Why it happened',exact:true}).click(); await relationshipsMatch(expected.result); await calls(1);
  }
  for(const width of [390,320]) {
    await page.setViewportSize({width,height:844}); await page.goto(base.origin,{waitUntil:'networkidle'}); await calls(0);
    const scrollBefore = await prepareGesture(); await page.keyboard.press('Enter');
    await page.getByRole('heading',{name:'Supported root cause',exact:true}).waitFor(); await calls(1);
    const id=cases.complete.ids.shipping;
    await page.waitForFunction(target=>[...document.querySelectorAll('[data-node-id]')].find(node=>node.getAttribute('data-node-id')===target)?.getBoundingClientRect().width>=140,id);
    const mobile=await snapshot(); assert(mobile.scrollWidth<=mobile.width,`Horizontal page overflow at${width}.`);
    assert(mobile.nodes.find(node=>node.id===id).bounds.width>=140);
    const markers = await markerCheck(cases.complete, scrollBefore);
    evidence.checks[`mobile${width}`]={...mobile,markers}; await capture(`mobile-${width}-cause`);
    await page.getByRole('button',{name:'Back to selected item',exact:true}).focus();
    await page.evaluate(()=>{window.__investigationFrames=[];let n=0;const read=()=>{window.__investigationFrames.push(document.querySelector('.react-flow__viewport')?.getAttribute('style'));if(++n<16)requestAnimationFrame(read);};requestAnimationFrame(read);});
    await page.keyboard.press('Enter'); await page.waitForFunction(()=>window.__investigationFrames.length===16);
    const frames=await page.evaluate(()=>window.__investigationFrames); assert(new Set(frames).size<=2,'Reduced-motion camera should not tween.');
    assert(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)); await calls(1);
    const selected=(await snapshot()).nodes.find(node=>node.id===cases.complete.ids.failure);assert(selected.bounds.width>=140);
  }
  assert.deepEqual(evidence.blockedRequests,[]); assert.deepEqual(evidence.pageErrors,[]); assert.deepEqual(evidence.consoleErrors,[]);
  evidence.passed=true;
} catch(error) { evidence.error=error.stack; evidence.failureSnapshot=await snapshot().catch(()=>null); await capture('failure').catch(()=>{}); throw error; }
finally { writeFileSync(join(report,'verification.json'),JSON.stringify(evidence,null,2)+'\n');await browser.close(); }
console.log(JSON.stringify({passed:evidence.passed,browser:evidence.browser,checks:Object.keys(evidence.checks),screenshots:evidence.screenshots}));
