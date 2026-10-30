/** Optional local browser proof. Uses an existing Playwright/browser installation only. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:5312');
assert(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) && base.port === '5312' && base.pathname === '/' && !base.username && !base.password && !base.search && !base.hash, 'Use the new loopback investigation preview on port5312.');
const loaded = await import(process.env.GROUPED_FLOW_PLAYWRIGHT_MODULE ?? 'playwright');
const playwright = loaded.default ?? loaded;
const report = process.env.GROUPED_FLOW_REPORT_DIR ? resolve(process.env.GROUPED_FLOW_REPORT_DIR) : mkdtempSync(join(tmpdir(), 'grouped-investigation-browser-'));
mkdirSync(report, { recursive: true });
const native = process.env.GROUPED_INVESTIGATION_EXPECTED_RESULTS ? JSON.parse(readFileSync(process.env.GROUPED_INVESTIGATION_EXPECTED_RESULTS, 'utf8')) : undefined;
const prior = process.env.GROUPED_FLOW_BASELINE_RESULTS ? JSON.parse(readFileSync(process.env.GROUPED_FLOW_BASELINE_RESULTS, 'utf8')) : undefined;
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
    const tokens = path => {
      const raw=path.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g),normalized=[];
      let point;
      for(let cursor=0;cursor<raw.length;){const command=raw[cursor++],count={M:2,L:2,Q:4}[command];assert(count,'Expected existing smooth-step design commands.');const values=raw.slice(cursor,cursor+count);cursor+=count;const end={x:Number(values.at(-2)),y:Number(values.at(-1))};
        // Collinear handles can serialize a zero-length rounded bend before
        // ReactFlow settles on exact integers. Remove only sub-.001px motion.
        const zero=command!=='M'&&point&&Math.hypot(end.x-point.x,end.y-point.y)<=.001&&(command!=='Q'||Math.hypot(Number(values[0])-point.x,Number(values[1])-point.y)<=.001);
        if(!zero)normalized.push(command,...values);point=end;
      }
      return normalized;
    };
    const left=tokens(actual[index].path),right=tokens(expected[index].path);
    assert.equal(left.length,right.length,'Design path commands must stay unchanged.');
    for(let token=0;token<left.length;token++) {
      if (/^[a-zA-Z]$/.test(left[token])) assert.equal(left[token],right[token]);
      else { const drift=Math.abs(Number(left[token])-Number(right[token]));assert(drift<=.001,'Design path coordinates must stay within .001 diagram pixels.');maxCoordinateDrift=Math.max(maxCoordinateDrift,drift); }
    }
  }
  return {maxCoordinateDrift,tolerance:.001};
};
const desktopFraming = async (requireDesign=false) => {
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
  if(requireDesign)assert(labels.no);assert.equal(labels.recorded.length,3);
  for(const label of labels.recorded){const a=label.bounds,b=labels.no;if(b)assert(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),'Recorded caption must not overlap the design No caption.');assert(label.title?.includes('Per-write'));}
  return labels;
};
const relationshipsMatch = async (result, ids=result.backward.edges.map((_,index)=>`recorded-dependency:${index}`)) => {
  await edgeCount(result.backward.edges.length); await settle();
  const points = await page.evaluate(({edges,ids}) => edges.map((edge, index) => {
    const rendered = [...document.querySelectorAll('.gfd-recorded-relationship')].find(element => element.getAttribute('data-id') === ids[index]);
    const path = rendered?.querySelector('.react-flow__edge-path'), matrix = path?.getScreenCTM();
    const endpoint = (id, type, point) => {
      const node = [...document.querySelectorAll('[data-node-id]')].find(item => item.getAttribute('data-node-id') === id);
      const ordinal=[...ids].sort().indexOf(ids[index]);
      return [...node?.querySelectorAll('[data-recorded-port]') ?? []].flatMap(handle => {
        const matches=handle.getAttribute('data-recorded-port')===`recorded-${ordinal}-${type}`;
        const box = handle.getBoundingClientRect();
        const side=handle.getAttribute('data-handlepos')??['left','right','top','bottom'].find(value=>handle.classList.contains(`react-flow__handle-${value}`));
        return matches && point && point.x >= box.left-2 && point.x <= box.right+2 && point.y >= box.top-2 && point.y <= box.bottom+2 ? [{...box.toJSON(),side,port:handle.getAttribute('data-recorded-port'),nodeBounds:node.getBoundingClientRect().toJSON(),scale:Math.abs(matrix.a)}] : [];
      })[0] ?? null;
    };
    const point = distance => { if (!path || !matrix) return null; const p = path.getPointAtLength(distance); return new DOMPoint(p.x,p.y).matrixTransform(matrix).toJSON(); };
    const length=path?.getTotalLength()??0,start=point(0),end=point(length),first=path?.getPointAtLength(4),last=path?.getPointAtLength(length-4),localStart=path?.getPointAtLength(0),localEnd=path?.getPointAtLength(length);
    return { from: edge.from, to: edge.to, attribution:edge.attribution,start, end,worldStart:localStart&&{x:localStart.x,y:localStart.y},worldEnd:localEnd&&{x:localEnd.x,y:localEnd.y},source: endpoint(edge.from,'source',start), target: endpoint(edge.to,'target',end), sourceDelta:first&&{x:first.x-localStart.x,y:first.y-localStart.y},targetDelta:last&&{x:localEnd.x-last.x,y:localEnd.y-last.y},label: rendered?.getAttribute('aria-label') };
  }), {edges:result.backward.edges,ids});
  evidence.currentRelationshipPoints = points;
  const touches = (point,handle) => point.x>=handle.left-2 && point.x<=handle.right+2 && point.y>=handle.top-2 && point.y<=handle.bottom+2;
  for (const edge of points) {
    assert(edge.start && edge.end && edge.source && edge.target, 'Recorded edge must have both declared handles.');
    assert(touches(edge.start,edge.source), 'Arrow source must touch the canonical dependent handle.');
    assert(touches(edge.end,edge.target), 'Arrow target must touch the canonical recorded parent handle.');
    for(const[type,handle,delta]of[['source',edge.source,edge.sourceDelta],['target',edge.target,edge.targetDelta]]){
      const normal=handle.side==='left'?{x:-1,y:0}:handle.side==='right'?{x:1,y:0}:handle.side==='top'?{x:0,y:-1}:{x:0,y:1};
      assert(Math.abs(normal.x?delta.y:delta.x)<=.05,'Arrow stubs must meet the handle face normally.');
      assert((delta.x*normal.x+delta.y*normal.y)*(type==='source'?1:-1)>=3.9,'Arrow stubs must point outward at the source and inward at the target.');
      const centre=normal.x?(handle.nodeBounds.top+handle.nodeBounds.bottom)/2:(handle.nodeBounds.left+handle.nodeBounds.right)/2,port=normal.x?(handle.top+handle.bottom)/2:(handle.left+handle.right)/2;
      assert(Math.abs(port-centre)/handle.scale>=20-.001,'Recorded ports must clear the standard workflow centre.');
    }
    assert.match(edge.label, /data dependency/);
    if(edge.attribution==='per-write')assert.match(edge.label,/Per-write link[.] data dependency/);
  }
  const endpoints=points.flatMap(edge=>[{node:edge.from,point:edge.worldStart,port:edge.source.port},{node:edge.to,point:edge.worldEnd,port:edge.target.port}]);
  assert.equal(new Set(endpoints.map(endpoint=>endpoint.port)).size,endpoints.length,'Each recorded endpoint needs its own stable port.');
  for(let a=0;a<endpoints.length;a++)for(let b=a+1;b<endpoints.length;b++)if(endpoints[a].node===endpoints[b].node)assert(Math.hypot(endpoints[a].point.x-endpoints[b].point.x,endpoints[a].point.y-endpoints[b].point.y)>=24-.001,'Recorded endpoints on the same card must be at least24 diagram pixels apart.');
  return points;
};
const routingReadability = async ({visible=false}={}) => {
  const result=await page.evaluate(()=>{
    const rect=e=>e.getBoundingClientRect().toJSON(),overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    const nodes=[...document.querySelectorAll('[data-node-id]')],cards=nodes.filter(e=>e.getAttribute('data-expanded')!=='true').map(e=>({id:e.getAttribute('data-node-id'),bounds:rect(e)}));
    const headers=nodes.filter(e=>e.getAttribute('data-expanded')==='true').map(e=>{const box=rect(e),text=[...e.querySelectorAll('*')].filter(item=>item.children.length===0&&item.textContent?.trim());return{id:e.getAttribute('data-node-id'),bounds:{...box,bottom:Math.max(box.top,...text.map(item=>rect(item).bottom))+10}};});
    const badges=[...document.querySelectorAll('[data-node-id] span')].filter(e=>['Supported cause','Cause inside'].includes(e.textContent?.trim())).map(e=>({id:e.closest('[data-node-id]').getAttribute('data-node-id'),bounds:rect(e)}));
    const labels=[...document.querySelectorAll('[data-relationship-id]')].map(e=>({id:e.getAttribute('data-relationship-id'),bounds:rect(e),title:e.getAttribute('title')}));
    const choices=[...document.querySelectorAll('.react-flow__edge-text')].filter(e=>['Yes','No'].includes(e.textContent)).map(e=>({id:e.textContent,bounds:rect(e)})),collisions=[];
    for(const label of labels){for(const obstacle of[...cards,...headers,...badges,...choices])if(overlap(label.bounds,obstacle.bounds))collisions.push({kind:'label-obstacle',label:label.id,obstacle:obstacle.id});for(const other of labels)if(label.id<other.id&&overlap(label.bounds,other.bounds))collisions.push({kind:'label-label',a:label.id,b:other.id});}
    const paths=[...document.querySelectorAll('.gfd-recorded-relationship')].map(edge=>{
      const path=edge.querySelector('.react-flow__edge-path'),matrix=path.getScreenCTM(),length=path.getTotalLength(),hits=new Set();
      for(let distance=3;distance<length-3;distance+=2){const p=path.getPointAtLength(distance),point=new DOMPoint(p.x,p.y).matrixTransform(matrix);for(const obstacle of[...cards,...headers,...badges]){const b=obstacle.bounds;if(point.x>b.left+2&&point.x<b.right-2&&point.y>b.top+2&&point.y<b.bottom-2)hits.add(obstacle.id);}}
      for(const obstacle of hits)collisions.push({kind:'curve-obstacle',edge:edge.getAttribute('data-id'),obstacle});
      const middle=path.getPointAtLength(length/2);return{id:edge.getAttribute('data-id'),d:path.getAttribute('d'),length,middle:{x:middle.x,y:middle.y},stroke:getComputedStyle(path).stroke,strokeWidth:Number.parseFloat(getComputedStyle(path).strokeWidth),ariaLabel:edge.getAttribute('aria-label')};
    });return{cards,headers,badges,labels,choices,paths,collisions,canvas:rect(document.querySelector('.react-flow'))};
  });
  assert.deepEqual(result.collisions,[],'Recorded curves and labels must clear card content, headers, cause badges, and design labels.');
  assert.equal(new Set(result.paths.map(path=>path.d)).size,result.paths.length,'Fan and parallel links must retain distinct paths.');
  if(visible)for(const label of result.labels){const b=label.bounds,c=result.canvas;assert(b.left>=c.left&&b.right<=c.right&&b.top>=c.top&&b.bottom<=c.bottom,'Auto-framed recorded labels must be fully inside the canvas.');}
  return result;
};
const canonicalCrossings = async () => {
  const crossings=await page.evaluate(()=>{
    const items=[...document.querySelectorAll('.gfd-recorded-relationship')].map(edge=>{const path=edge.querySelector('.react-flow__edge-path'),length=path.getTotalLength(),points=[];for(let at=0;at<length;at+=2){const p=path.getPointAtLength(at);points.push({x:p.x,y:p.y});}const end=path.getPointAtLength(length);points.push({x:end.x,y:end.y});return{id:edge.getAttribute('data-id'),points};});
    const hits=[],cross=(a,b)=>a.x*b.y-a.y*b.x;
    for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){const one=items[a],two=items[b];for(let i=1;i<one.points.length;i++)for(let j=1;j<two.points.length;j++){
      const p=one.points[i-1],q=two.points[j-1],r={x:one.points[i].x-p.x,y:one.points[i].y-p.y},s={x:two.points[j].x-q.x,y:two.points[j].y-q.y},den=cross(r,s);if(Math.abs(den)<1e-7)continue;
      const qp={x:q.x-p.x,y:q.y-p.y},t=cross(qp,s)/den,u=cross(qp,r)/den;if(t< -1e-6||t>1+1e-6||u< -1e-6||u>1+1e-6)continue;
      const point={x:p.x+t*r.x,y:p.y+t*r.y},dot=Math.abs(r.x*s.x+r.y*s.y)/Math.hypot(r.x,r.y)/Math.hypot(s.x,s.y);
      if(dot>.1||[one.points[0],one.points.at(-1),two.points[0],two.points.at(-1)].some(end=>Math.hypot(point.x-end.x,point.y-end.y)<1))continue;
      if(!hits.some(hit=>hit.a===one.id&&hit.b===two.id&&Math.hypot(hit.point.x-point.x,hit.point.y-point.y)<1))hits.push({a:one.id,b:two.id,point});
    }}return hits;
  });
  assert.deepEqual(crossings,[],'This canonical three-link example must have no perpendicular recorded crossings.');return crossings;
};
const canonicalFacingFork = async (expected, points, checkCurvature) => {
  const paths=await page.evaluate(()=>[...document.querySelectorAll('.gfd-recorded-relationship')].map(edge=>{
    const d=edge.querySelector('.react-flow__edge-path').getAttribute('d'),tokens=d.match(/[MLQ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g),curves=[];let previous;
    for(let at=0;at<tokens.length;){const command=tokens[at++],count={M:2,L:2,Q:4}[command];if(!count)throw Error('Expected the existing rounded orthogonal SVG commands.');const values=tokens.slice(at,at+count).map(Number);at+=count;const end={x:values.at(-2),y:values.at(-1)};if(command==='Q'){const control={x:values[0],y:values[1]},radius=Math.min(Math.hypot(previous.x-control.x,previous.y-control.y),Math.hypot(end.x-control.x,end.y-control.y));if(radius>.05)curves.push({radius,control});}previous=end;}
    return{id:edge.getAttribute('data-id'),curves};
  }));
  const anchors=[];
  for(const point of points){
    assert.equal(point.source.side,'left','This clear leftward fixture must exit through a LEFT port.');assert.equal(point.target.side,'right','This clear leftward fixture must enter through a RIGHT port.');
    for(const[type,handle]of[['source',point.source],['target',point.target]]){const actual=type==='source'?point.start:point.end,face={x:type==='source'?handle.left:handle.right,y:(handle.top+handle.bottom)/2},drift=Math.hypot(actual.x-face.x,actual.y-face.y)/handle.scale;assert(drift<=.001,'The native SVG anchor must remain on its actual handle outer face within serialization precision.');anchors.push({port:handle.port,faceDrift:drift});}
  }
  const fork=points.map((point,index)=>({...point,id:`recorded-dependency:${index}`})).filter(point=>point.from===expected.ids.decision).sort((a,b)=>a.worldEnd.y-b.worldEnd.y);
  assert.equal(fork.length,2);assert(fork[0].worldStart.y<fork[1].worldStart.y,'Decision LEFT exits must follow the upper/lower target order.');
  if(checkCurvature)for(const branch of fork){const curves=paths.find(path=>path.id===branch.id).curves;assert.equal(curves.length,2,'Each canonical fork branch must retain two visible rounded bends.');assert(curves.every(curve=>curve.radius>=7.4&&curve.radius<=16+.001),'This canonical gap must keep its measured rounded bends; smaller legitimate gaps have no universal radius promise.');}
  return{naturalLeftExitRightEntry:true,upperLowerForkOrder:true,anchors,paths,curvatureChecked:checkCurvature};
};
const scopeState = () => page.evaluate(()=>({focus:document.querySelector('[data-investigation-focus]')?.getAttribute('data-investigation-focus'),captions:[...document.querySelectorAll('[data-relationship-id]')].map(node=>({id:node.getAttribute('data-relationship-id'),opacity:Number(getComputedStyle(node).opacity),visible:node.getAttribute('data-caption-visible'),title:node.getAttribute('title'),aria:node.getAttribute('aria-label')})),ports:[...document.querySelectorAll('[data-recorded-port]')].map(node=>({id:node.getAttribute('data-recorded-port'),left:node.style.left,top:node.style.top})).sort((a,b)=>a.id.localeCompare(b.id))}));
const scopeRestoration = async () => {
  const focused=await snapshot(),focusedState=await scopeState();assert.equal(focusedState.focus,'true');assert.deepEqual(focused.design,[]);assert(focusedState.captions.every(caption=>caption.opacity===0&&caption.title&&caption.aria));
  await page.getByRole('button',{name:'Show whole flow',exact:true}).click();await designCount(8);await settle();await calls(1);
  const whole=await snapshot(),wholeState=await scopeState();assert.equal(wholeState.focus,'false');assert.deepEqual(whole.geometry,focused.geometry);assert.deepEqual(whole.relationships,focused.relationships);assert.deepEqual(wholeState.ports,focusedState.ports);assert(wholeState.captions.every(caption=>caption.opacity===1));
  const framing=await desktopFraming(true);if(prior){assert.deepEqual(whole.geometry,prior.checks.complete.geometry);unchangedDesign(whole.design,prior.checks.complete.design);}
  await page.getByRole('button',{name:'What it affected',exact:true}).click();await settle();await calls(1);assert.equal((await scopeState()).focus,'false');await page.getByRole('button',{name:'Why it happened',exact:true}).click();await edgeCount(3);await calls(1);assert.equal((await scopeState()).focus,'false');
  await page.getByRole('button',{name:'Focus on recorded links',exact:true}).click();await designCount(0);await settle();await calls(1);assert.equal((await scopeState()).focus,'true');assert.deepEqual((await snapshot()).geometry,focused.geometry);
  const point=await page.evaluate(()=>{const path=document.querySelector('[data-recorded-connection="recorded-dependency:0"] .react-flow__edge-path'),p=path.getPointAtLength(path.getTotalLength()/2),q=new DOMPoint(p.x,p.y).matrixTransform(path.getScreenCTM());return{x:q.x,y:q.y};});await page.mouse.move(point.x,point.y);await page.waitForFunction(()=>document.querySelector('[data-relationship-id="recorded-dependency:0"]')?.getAttribute('data-caption-visible')==='true');
  const hovered=await scopeState();assert.equal(hovered.captions.find(caption=>caption.id==='recorded-dependency:0').opacity,1);await page.mouse.move(5,5);await page.waitForFunction(()=>{const caption=document.querySelector('[data-relationship-id="recorded-dependency:0"]');return caption&&Number(getComputedStyle(caption).opacity)===0;});
  return{focused:focusedState,whole:wholeState,wholeGeometry:whole.geometry,wholeDesign:whole.design,framing,hoverRevealsMetadata:true,modeChangesReuseQuery:true};
};
const decisionPresentation = async id => {
  const result=await page.evaluate(target=>{
    const node=[...document.querySelectorAll('[data-node-id]')].find(item=>item.getAttribute('data-node-id')===target),button=node?.querySelector('button'),title=button?.querySelector('strong');
    return{bounds:button?.getBoundingClientRect().toJSON(),radius:button&&getComputedStyle(button).borderRadius,description:button?.getAttribute('aria-describedby')?.split(' ').map(id=>document.getElementById(id)?.textContent).join(' '),outerDiamond:node?.querySelectorAll(':scope > svg polygon').length,hostIcon:!!button?.querySelector('svg'),title:title?.textContent,titleFits:!!title&&title.scrollWidth<=title.clientWidth&&title.scrollHeight<=title.clientHeight};
  },id);
  assert.match(result.description,/Decision/);assert.match(result.description,/Completed/);assert.equal(result.outerDiamond,0);assert(result.hostIcon&&result.titleFits);assert(Number.parseFloat(result.radius)>0);assert.equal(result.title,'Rates usable?');
  assert.equal(await page.getByText(/Warm backward links: recorded sources, not failed steps/).count(),1);assert.equal(await page.getByText(/Teal forward links: recorded impact, not proof of harm/).count(),1);
  return result;
};
const requestOwnership = async () => {
  await page.setViewportSize({width:1440,height:1200});await page.goto(base.origin,{waitUntil:'networkidle'});
  await page.evaluate(async entry=>{
    const urls=performance.getEntriesByType('resource').map(item=>item.name),r=await import(urls.find(url=>/\/react[.]js(?:[?]|$)/.test(url))),d=await import(urls.find(url=>/\/react-dom_client[.]js(?:[?]|$)/.test(url))),React=r.default??r,{createRoot}=d.default??d,{GroupedFlowInvestigation}=await import('/@fs/'+entry),{createRecordedInvestigationExample}=await import('/recorded.ts');
    const first=createRecordedInvestigationExample('complete'),next=createRecordedInvestigationExample('missing'),counts={old:0,next:0};let finish,refresh=()=>{},settled=false;
    const delayed={...first.port,explain:nodeId=>{counts.old++;refresh();return new Promise(resolve=>{finish=async()=>{const result=await first.port.explain(nodeId,{signal:new AbortController().signal});resolve(result);settled=true;refresh();};});}},current={...next.port,explain:(...args)=>{counts.next++;refresh();return next.port.explain(...args);}};
    function Host(){const[changed,setChanged]=React.useState(false),[,rerender]=React.useState(0);refresh=()=>rerender(value=>value+1);const sample=changed?next:first;return React.createElement(React.Fragment,null,React.createElement('button',{onClick:()=>setChanged(true)},'Switch recording owner'),React.createElement('button',{onClick:()=>finish?.()},'Resolve previous evidence'),React.createElement('button',{onClick:refresh},'Rerender same recording'),React.createElement('output',{'data-testid':'analysis-count'},counts.old+counts.next),React.createElement('output',{'data-owner':changed?'missing':'complete','data-old-settled':settled},settled?'Previous evidence resolved':'Waiting for previous evidence'),React.createElement(GroupedFlowInvestigation,{definition:sample.definition,observation:sample.observation,port:changed?current:delayed,direction:'LR'}));}
    const host=document.createElement('main');host.style.padding='20px';document.body.replaceChildren(host);createRoot(host).render(React.createElement(Host));
  },fileURLToPath(new URL('../../src/flowchart.ts',import.meta.url)));
  await page.getByRole('button',{name:'Select No shipping option',exact:true}).click();await calls(1);await page.getByRole('button',{name:'Switch recording owner',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-owner]')?.getAttribute('data-owner')==='missing');assert.equal((await scopeState()).focus,'false');
  await page.getByRole('button',{name:'Resolve previous evidence',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-old-settled]')?.getAttribute('data-old-settled')==='true');await settle();assert.equal(await page.getByText('Supported cause',{exact:true}).count(),0);assert.equal(await page.getByRole('heading',{name:'Supported root cause',exact:true}).count(),0);await edgeCount(0);await calls(1);
  await page.getByRole('button',{name:'Select No shipping option',exact:true}).click();await page.getByRole('heading',{name:'Root cause unknown',exact:true}).waitFor();await calls(2);assert.equal((await scopeState()).focus,'true');
  await page.getByRole('button',{name:'Show whole flow',exact:true}).click();await designCount(8);await page.getByRole('button',{name:'Rerender same recording',exact:true}).click();await settle();assert.equal((await scopeState()).focus,'false');await calls(2);
  await page.getByRole('button',{name:'Select No shipping option',exact:true}).click();await page.getByRole('button',{name:'Show whole flow',exact:true}).waitFor();await calls(3);assert.equal((await scopeState()).focus,'true');assert.equal(await page.getByText('Supported cause',{exact:true}).count(),0);
  return{lateOldOwnerCompletionIgnored:true,newOwnerStartsWholeFlow:true,sameOwnerRerenderPreservesWholeFlow:true,newRequestResetsFocus:true,callsForThreeExplicitFailureClicks:3};
};
const collapsedRecordedFit = async (width, expected) => {
  await page.setViewportSize({width,height:width<600?844:1200});await page.goto(base.origin,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Select No shipping option',exact:true}).click();await page.getByRole('heading',{name:'Supported root cause',exact:true}).waitFor();await calls(1);
  const summary=await page.getByRole('status',{name:'Cause summary',exact:true}).textContent();
  const detail=page.locator('details').filter({has:page.locator('summary').filter({hasText:'Recorded dependency evidence'})}),references=await detail.textContent();
  await page.getByRole('button',{name:'Show whole flow',exact:true}).click();await designCount(8);await settle();
  await page.getByRole('button',{name:'Collapse Delivery checks',exact:true}).click();await page.getByRole('button',{name:'Expand Delivery checks',exact:true}).waitFor();
  await page.getByRole('button',{name:'Focus on recorded links',exact:true}).click();await edgeCount(1);await settle();
  await page.locator('.react-flow').evaluate(element=>element.scrollIntoView({block:'center'}));await settle();
  const canvas=await page.locator('.react-flow').boundingBox(),height=page.viewportSize().height;
  const origin={x:canvas.x+canvas.width-10,y:Math.min(canvas.y+canvas.height-10,height-10)};
  const beforePan=(await snapshot()).viewport;
  await page.mouse.move(origin.x,origin.y);await page.mouse.down();await page.mouse.move(origin.x-160,origin.y-110,{steps:8});await page.mouse.up();await settle();
  const panned=(await snapshot()).viewport;assert.notEqual(panned,beforePan,'The regression must move the camera away before fitting the collapsed root.');
  await page.getByRole('button',{name:'Fit recorded view',exact:true}).click();await settle();
  const view=await snapshot(),proxy=view.nodes.find(node=>node.id==='delivery-group'),fittedCanvas=await page.locator('.react-flow').boundingBox();
  assert.notEqual(view.viewport,panned,'Fit recorded view must move the camera to the visible collapsed proxy.');
  assert(proxy&&proxy.bounds.left>=fittedCanvas.x&&proxy.bounds.right<=fittedCanvas.x+fittedCanvas.width&&proxy.bounds.top>=fittedCanvas.y&&proxy.bounds.bottom<=fittedCanvas.y+fittedCanvas.height,'The collapsed proxy must be fully inside the canvas.');
  if(width<600)assert(proxy.bounds.width>=140&&proxy.bounds.top>=0&&proxy.bounds.bottom<=height,'Phone fitting must show a readable visible group proxy.');
  assert.equal(proxy.state,'unknown');assert(!view.nodes.some(node=>node.id===expected.result.rootCause),'Fitting must respect the owner’s collapsed group.');
  assert.equal(await page.getByRole('button',{name:'Expand Delivery checks',exact:true}).count(),1);assert.equal(await page.getByText('Supported cause',{exact:true}).count(),0,'A visible camera proxy must never become the supported root.');
  assert.equal(await page.getByText('Cause inside',{exact:true}).count(),1);assert.equal(await page.getByRole('status',{name:'Cause summary',exact:true}).textContent(),summary);assert.equal(await detail.textContent(),references);
  assert.deepEqual(view.relationships.map(edge=>edge.id),['recorded-dependency:0'],'The collapsed external link retains its canonical relationship ID.');assert.equal(view.nodes.find(node=>node.id===expected.ids.failure).selected,'true');await calls(1);
  const requested=await page.locator('[data-camera-focus]').getAttribute('data-camera-focus');assert(requested.includes('delivery-group')&&!requested.includes(expected.result.rootCause),'The camera target must use visible containment while the canonical root remains exact.');
  if(width<600)assert.equal(requested,'delivery-group');else assert.equal(requested.split('delivery-group').length-1,1,'Desktop fit targets deduplicate the shared visible ancestor.');
  if(width===390){const path=join(report,'mobile-390-collapsed-cause.png');await page.screenshot({path,fullPage:false});evidence.screenshots.push(path);}
  return{width,proxy:proxy.bounds,cameraTarget:requested,beforePan,panned,fitted:view.viewport,canonicalRoot:expected.result.rootCause,summary,ownerCollapsePreserved:true,proxyCauseInsideOnly:true,evidenceUnchanged:true,analysisCalls:1};
};
const denseRoutingCases = async () => {
  await page.setViewportSize({width:1440,height:1200});await page.goto(base.origin,{waitUntil:'networkidle'});
  const fixture=await page.evaluate(async entry=>{
    const resources=performance.getEntriesByType('resource').map(item=>item.name),reactURL=resources.find(url=>/\/react[.]js(?:[?]|$)/.test(url)),domURL=resources.find(url=>/\/react-dom_client[.]js(?:[?]|$)/.test(url));
    if(!reactURL||!domURL)throw Error('Public fixture needs the already-loaded React dependency modules.');
    const reactModule=await import(reactURL),domModule=await import(domURL),React=reactModule.default??reactModule,{createRoot}=domModule.default??domModule,{GroupedFlowDiagram}=await import('/@fs/'+entry);
    const definition={nodes:[{id:'outer',label:'Outer flow',kind:'group'},{id:'inner',label:'Inner flow',kind:'group',parentId:'outer'},{id:'a',label:'Recorded root',parentId:'inner'},{id:'blocker',label:'Unrelated blocker',parentId:'inner'},{id:'c',label:'Selected failure',parentId:'inner'},{id:'out',label:'Outside step'}],edges:[{id:'design:a-blocker',source:'a',target:'blocker',label:'Yes'},{id:'design:blocker-c',source:'blocker',target:'c',label:'No'},{id:'design:c-out',source:'c',target:'out'}]};
    const links=[{id:'parallel:0',source:'c',target:'a'},{id:'parallel:1',source:'c',target:'a'},{id:'fan:0',source:'c',target:'blocker'},{id:'nested:0',source:'out',target:'a'}].map(edge=>({...edge,kind:'data',attribution:'recorded-read',evidence:['fixture:recorded-read'],direction:'backward'}));
    function Harness(){const[show,setShow]=React.useState(false),[direction,setDirection]=React.useState('LR'),[forward,setForward]=React.useState(false);return React.createElement(React.Fragment,null,React.createElement('button',{onClick:()=>setShow(value=>!value)},'Toggle recorded overlay'),React.createElement('button',{onClick:()=>setDirection(value=>value==='LR'?'TB':'LR')},'Change direction'),React.createElement('button',{onClick:()=>setForward(value=>!value)},'Change relationship direction'),React.createElement(GroupedFlowDiagram,{definition,observation:{nodeStates:{a:'completed',blocker:'completed',c:'failed',out:'completed',outer:'unknown',inner:'unknown'},edgeStates:{'design:a-blocker':'observed','design:blocker-c':'observed','design:c-out':'observed'}},highlight:{nodeIds:['a','c','out'],rootCauseId:'a'},selectedNodeId:'c',defaultExpandedGroupIds:['outer','inner'],direction,recordedRelationships:show?links.map(link=>({...link,direction:forward?'forward':'backward'})):[],style:{height:1000},'aria-label':'Routing regression fixture'}));}
    const host=document.createElement('main');host.style.cssText='padding:20px;background:white;color:#222';document.body.replaceChildren(host);createRoot(host).render(React.createElement(Harness));return{definition,links};
  },fileURLToPath(new URL('../../src/flowchart.ts',import.meta.url)));
  await page.waitForFunction(()=>document.querySelector('[data-node-id="a"]'));
  const results={};
  evidence.checks.denseRouting=results;
  for(const direction of['LR','TB']){
    if(direction==='TB')await page.getByRole('button',{name:'Change direction',exact:true}).click();
    await page.waitForFunction(value=>document.querySelector('[data-direction]')?.getAttribute('data-direction')===value,direction);await settle();
    const baseline=await snapshot();await page.getByRole('button',{name:'Toggle recorded overlay',exact:true}).click();
    const projected={backward:{edges:fixture.links.map(link=>({from:link.source,to:link.target,attribution:link.attribution}))}};
    const endpoints=await relationshipsMatch(projected,fixture.links.map(link=>link.id)),readability=await routingReadability({visible:true}),withOverlay=await snapshot();
    results[direction]={baseline,withOverlay,endpoints,readability};
    assert.deepEqual(withOverlay.geometry,baseline.geometry,'Recorded routing must leave node world geometry unchanged.');
    unchangedDesign(withOverlay.design,baseline.design);
    assert.equal(withOverlay.nodes.find(node=>node.id==='a').state,'completed');assert.equal(withOverlay.nodes.find(node=>node.id==='c').state,'failed');
    assert.equal(await page.getByText('Supported cause',{exact:true}).count(),1);
    const parallel=readability.paths.filter(path=>path.id.startsWith('parallel:'));assert.equal(parallel.length,2);assert.notDeepEqual(parallel[0].middle,parallel[1].middle,'Parallel routes must retain separate lanes.');
    const colours=await page.evaluate(()=>({cause:[...new Set([...document.querySelectorAll('.gfd-recorded-relationship .react-flow__edge-path')].map(path=>getComputedStyle(path).stroke))],structural:[...new Set([...document.querySelectorAll('.react-flow__edge:not(.gfd-recorded-relationship) .react-flow__edge-path')].map(path=>getComputedStyle(path).stroke))]}));
    assert.equal(colours.cause.length,1);assert(!colours.structural.includes(colours.cause[0]),'Cause trail must differ from structural arrows.');
    assert(readability.paths.some(path=>path.d.includes('Q')),'Detours must retain rounded corners.');for(const path of readability.paths){assert(path.strokeWidth<2,'Recorded trails must remain lighter than normal structural arrows.');assert.match(path.ariaLabel,/Backward source trail, not a failed step/);}
    await page.getByRole('button',{name:'Change relationship direction',exact:true}).click();await settle();const forwardEndpoints=await relationshipsMatch(projected,fixture.links.map(link=>link.id));
    colours.impact=await page.evaluate(()=>[...new Set([...document.querySelectorAll('.gfd-recorded-relationship .react-flow__edge-path')].map(path=>getComputedStyle(path).stroke))]);
    assert.equal(colours.impact.length,1);assert.notEqual(colours.impact[0],colours.cause[0],'Forward impact and backward cause must have distinct colours.');assert(!colours.structural.includes(colours.impact[0]));
    assert(forwardEndpoints.every(edge=>edge.label.startsWith('Forward recorded impact.')));
    assert.deepEqual((await snapshot()).geometry,withOverlay.geometry);await page.getByRole('button',{name:'Change relationship direction',exact:true}).click();await settle();
    results[direction]={endpoints,readability,geometry:withOverlay.geometry,design:withOverlay.design,colours,forwardEndpoints};await capture(`dense-${direction.toLowerCase()}-routing`);
    const canvas=readability.canvas,panStart={x:canvas.right-25,y:canvas.bottom-25};await page.mouse.move(panStart.x,panStart.y);await page.mouse.down();await page.mouse.move(panStart.x-80,panStart.y-40,{steps:5});await page.mouse.up();await settle();
    const panned=(await snapshot()).viewport;assert.notEqual(panned,withOverlay.viewport,'The manual pan gesture must move the camera.');
    await page.getByRole('button',{name:'Toggle recorded overlay',exact:true}).click();await edgeCount(0);await settle();assert.equal((await snapshot()).viewport,panned,'Routing-bound changes must preserve a manually owned camera.');
    results[direction].manualPanPreserved=true;await page.getByRole('button',{name:'Fit diagram',exact:true}).click();await settle();
    await page.getByRole('button',{name:'Collapse Inner flow · Group 1',exact:true}).focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Expand Inner flow · Group 1',exact:true}).waitFor();await settle();
    const collapsedBaseline=await snapshot();await page.getByRole('button',{name:'Toggle recorded overlay',exact:true}).click();
    const collapsed={backward:{edges:[{from:'out',to:'inner',attribution:'recorded-read'}]}};
    const collapsedEndpoints=await relationshipsMatch(collapsed,['nested:0']),collapsedReadability=await routingReadability(),collapsedView=await snapshot();
    results[`${direction}Collapsed`]={baseline:collapsedBaseline,withOverlay:collapsedView,endpoints:collapsedEndpoints,readability:collapsedReadability};
    assert.deepEqual(collapsedView.geometry,collapsedBaseline.geometry);unchangedDesign(collapsedView.design,collapsedBaseline.design);
    assert.equal(collapsedView.nodes.find(node=>node.id==='inner').state,'unknown');assert.equal(await page.getByText('Supported cause',{exact:true}).count(),0);
    results[`${direction}Collapsed`]={endpoints:collapsedEndpoints,readability:collapsedReadability};
    await page.getByRole('button',{name:'Toggle recorded overlay',exact:true}).click();await edgeCount(0);await page.getByRole('button',{name:'Expand Inner flow · Group 1',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-node-id="a"]'));
  }
  return results;
};
try {
  await page.goto(base.origin, { waitUntil: 'networkidle' });
  const cases = native?.cases ?? await page.evaluate(async () => { const module = await import('/recorded.ts'); const output = {}; for (const name of ['complete','missing','ambiguous']) { const sample=module.createRecordedInvestigationExample(name); output[name]={ids:sample.ids,definition:sample.definition,observation:sample.observation,result:await sample.port.explain(sample.ids.failure,{signal:new AbortController().signal})}; } return output; });
  for (const name of ['complete','missing','ambiguous']) {
    const expected = cases[name]; assert(expected.result.backward, 'Native reader must provide backward evidence.');
    if (name !== 'complete') await page.getByLabel('Recording to inspect', { exact:true }).selectOption(name);
    await calls(0); await page.getByRole('button',{name:'Select No shipping option',exact:true}).waitFor();
    assert.equal((await scopeState()).focus,'false','A new recording must begin with the whole workflow.');assert.equal(await page.getByRole('button',{name:'Show whole flow',exact:true}).count(),0);
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
    const routing=await routingReadability({visible:true}),decision=await decisionPresentation(expected.ids.decision);
    const markers = await markerCheck(expected, scrollBefore);
    const framing=await desktopFraming();
    const crossings=name==='complete'?await canonicalCrossings():undefined;
    const facingFork=await canonicalFacingFork(expected,points,name==='complete');
    const groups=new Set(expected.definition.nodes.filter(node=>node.kind==='group').map(node=>node.id));
    assert.deepEqual(view.nodes.filter(node=>node.highlighted==='true'&&!groups.has(node.id)).map(node=>node.id).sort(), [...new Set(expected.result.backward.nodes)].sort());
    assert.deepEqual(view.nodes.filter(node=>node.highlighted==='true'&&groups.has(node.id)).map(node=>node.id),['delivery-group']);
    assert.equal(view.nodes.find(node=>node.id==='delivery-group').state,'unknown');
    assert.equal(view.nodes.find(node=>node.id==='payment-group').state,'unknown');
    assert.equal(view.nodes.find(node=>node.id===expected.ids.failure).selected,'true');
    assert.deepEqual(view.design,[],'Cause focus must hide competing workflow arrows.');
    const detail=page.locator('details').filter({has:page.locator('summary').filter({hasText:'Recorded dependency evidence'})});
    assert.equal(await detail.count(),1);
    const evidenceText=await detail.textContent();
    for(const edge of expected.result.backward.edges)for(const reference of edge.evidence)assert(evidenceText.includes(reference),'Returned edge evidence must remain inspectable.');
    const scope=await scopeRestoration();assert(scope.wholeDesign.every(edge=>edge.id.startsWith('design:')&&!edge.className.includes('gfd-edge-highlighted')));
    if(name==='complete') { assert.equal(expected.result.rootCause,expected.ids.shipping); assert.match(await page.getByRole('region',{name:'Selected explanation'}).textContent(),/Shipping rates/); assert.deepEqual(view.geometry,evidence.checks.unadornedExpandedGeometry.geometry); evidence.checks.designGeometry=unchangedDesign(scope.wholeDesign,evidence.checks.unadornedExpandedGeometry.design); if(prior){assert.deepEqual(view.geometry,prior.checks.complete.geometry,'Routing and card styling must preserve the prior node world geometry.');evidence.checks.priorDesignGeometry=unchangedDesign(scope.wholeDesign,prior.checks.complete.design);} }
    else { assert.equal(expected.result.rootCause,undefined); assert.equal(await page.getByRole('heading',{name:'Supported root cause',exact:true}).count(),0); if(name==='missing')assert.equal(await page.getByText(/Some evidence is missing/).count(),1); else assert(expected.result.alternatives.length>1); }
    evidence.checks[name]={...view,focusDesign:view.design,design:scope.wholeDesign,canonicalEdges:expected.result.backward.edges,renderedEndpoints:points,framing,markers,routing,decision,scope,crossings,facingFork};
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
    const endpoints=await relationshipsMatch(cases.complete.result),routing=await routingReadability();
    await page.getByRole('button',{name:'Show whole flow',exact:true}).click();await designCount(8);await calls(1);await page.getByRole('button',{name:'Focus on recorded links',exact:true}).click();await designCount(0);await calls(1);
    await page.getByRole('button',{name:'Fit recorded view',exact:true}).click();await settle();const fitted=(await snapshot()).nodes.find(node=>node.id===id),canvas=await page.locator('.react-flow').boundingBox();assert(fitted.bounds.width>=140&&fitted.bounds.left>=canvas.x&&fitted.bounds.right<=canvas.x+canvas.width&&fitted.bounds.top>=canvas.y&&fitted.bounds.bottom<=canvas.y+canvas.height,'Phone fit must keep the readable root visibly inside the canvas.');
    evidence.checks[`mobile${width}`]={...mobile,markers,endpoints,routing,focusedFitRoot:fitted.bounds,wholeFocusQueryReuse:true}; await capture(`mobile-${width}-cause`);
    await page.getByRole('button',{name:'Back to selected item',exact:true}).focus();
    await page.evaluate(()=>{window.__investigationFrames=[];let n=0;const read=()=>{window.__investigationFrames.push(document.querySelector('.react-flow__viewport')?.getAttribute('style'));if(++n<16)requestAnimationFrame(read);};requestAnimationFrame(read);});
    await page.keyboard.press('Enter'); await page.waitForFunction(()=>window.__investigationFrames.length===16);
    const frames=await page.evaluate(()=>window.__investigationFrames); assert(new Set(frames).size<=2,'Reduced-motion camera should not tween.');
    assert(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)); await calls(1);
    const selected=(await snapshot()).nodes.find(node=>node.id===cases.complete.ids.failure);assert(selected.bounds.width>=140);
  }
  evidence.checks.collapsedRecordedFit=[];
  for(const width of[390,320,1440])evidence.checks.collapsedRecordedFit.push(await collapsedRecordedFit(width,cases.complete));
  evidence.checks.requestOwnership=await requestOwnership();
  evidence.checks.denseRouting=await denseRoutingCases();
  assert.deepEqual(evidence.blockedRequests,[]); assert.deepEqual(evidence.pageErrors,[]); assert.deepEqual(evidence.consoleErrors,[]);
  evidence.passed=true;
} catch(error) { evidence.error=error.stack; evidence.failureSnapshot=await snapshot().catch(()=>null); await capture('failure').catch(()=>{}); throw error; }
finally { writeFileSync(join(report,'verification.json'),JSON.stringify(evidence,null,2)+'\n');await browser.close(); }
console.log(JSON.stringify({passed:evidence.passed,browser:evidence.browser,checks:Object.keys(evidence.checks),screenshots:evidence.screenshots}));
