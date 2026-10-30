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
const relationshipsMatch = async (result, ids=result.backward.edges.map((_,index)=>`recorded-dependency:${index}`)) => {
  await edgeCount(result.backward.edges.length); await settle();
  const points = await page.evaluate(({edges,ids}) => edges.map((edge, index) => {
    const rendered = [...document.querySelectorAll('.gfd-recorded-relationship')].find(element => element.getAttribute('data-id') === ids[index]);
    const path = rendered?.querySelector('.react-flow__edge-path'), matrix = path?.getScreenCTM();
    const endpoint = (id, type, point) => {
      const node = [...document.querySelectorAll('[data-node-id]')].find(item => item.getAttribute('data-node-id') === id);
      return [...node?.querySelectorAll('[data-handleid]') ?? []].flatMap(handle => {
        const match = handle.getAttribute('data-handleid')?.match(new RegExp(`^recorded-(left|right|top|bottom)-${type}$`));
        const box = handle.getBoundingClientRect();
        return match && point && point.x >= box.left-2 && point.x <= box.right+2 && point.y >= box.top-2 && point.y <= box.bottom+2 ? [{...box.toJSON(),side:match[1]}] : [];
      })[0] ?? null;
    };
    const point = distance => { if (!path || !matrix) return null; const p = path.getPointAtLength(distance); return new DOMPoint(p.x,p.y).matrixTransform(matrix).toJSON(); };
    const length=path?.getTotalLength()??0,start=point(0),end=point(length),first=path?.getPointAtLength(4),last=path?.getPointAtLength(length-4),localStart=path?.getPointAtLength(0),localEnd=path?.getPointAtLength(length);
    return { from: edge.from, to: edge.to, attribution:edge.attribution,start, end, source: endpoint(edge.from,'source',start), target: endpoint(edge.to,'target',end), sourceDelta:first&&{x:first.x-localStart.x,y:first.y-localStart.y},targetDelta:last&&{x:localEnd.x-last.x,y:localEnd.y-last.y},label: rendered?.getAttribute('aria-label') };
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
    }
    assert.match(edge.label, /data dependency/);
    if(edge.attribution==='per-write')assert.match(edge.label,/Per-write link[.] data dependency/);
  }
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
const decisionPresentation = async id => {
  const result=await page.evaluate(target=>{
    const node=[...document.querySelectorAll('[data-node-id]')].find(item=>item.getAttribute('data-node-id')===target),button=node?.querySelector('button'),title=button?.querySelector('strong');
    return{bounds:button?.getBoundingClientRect().toJSON(),radius:button&&getComputedStyle(button).borderRadius,description:button?.getAttribute('aria-describedby')?.split(' ').map(id=>document.getElementById(id)?.textContent).join(' '),outerDiamond:node?.querySelectorAll(':scope > svg polygon').length,hostIcon:!!button?.querySelector('svg'),title:title?.textContent,titleFits:!!title&&title.scrollWidth<=title.clientWidth&&title.scrollHeight<=title.clientHeight};
  },id);
  assert.match(result.description,/Decision/);assert.match(result.description,/Completed/);assert.equal(result.outerDiamond,0);assert(result.hostIcon&&result.titleFits);assert(Number.parseFloat(result.radius)>0);assert.equal(result.title,'Rates usable?');
  assert.equal(await page.getByText(/Warm backward links: recorded sources, not failed steps/).count(),1);assert.equal(await page.getByText(/Teal forward links: recorded impact, not proof of harm/).count(),1);
  return result;
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
    if(name==='complete') { assert.equal(expected.result.rootCause,expected.ids.shipping); assert.match(await page.getByRole('region',{name:'Selected explanation'}).textContent(),/Shipping rates/); assert.deepEqual(view.geometry,evidence.checks.unadornedExpandedGeometry.geometry); evidence.checks.designGeometry=unchangedDesign(view.design,evidence.checks.unadornedExpandedGeometry.design); if(prior){assert.deepEqual(view.geometry,prior.checks.complete.geometry,'Routing and card styling must preserve the prior node world geometry.');evidence.checks.priorDesignGeometry=unchangedDesign(view.design,prior.checks.complete.design);} }
    else { assert.equal(expected.result.rootCause,undefined); assert.equal(await page.getByRole('heading',{name:'Supported root cause',exact:true}).count(),0); if(name==='missing')assert.equal(await page.getByText(/Some evidence is missing/).count(),1); else assert(expected.result.alternatives.length>1); }
    evidence.checks[name]={...view,canonicalEdges:expected.result.backward.edges,renderedEndpoints:points,framing,markers,routing,decision};
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
    evidence.checks[`mobile${width}`]={...mobile,markers,endpoints,routing}; await capture(`mobile-${width}-cause`);
    await page.getByRole('button',{name:'Back to selected item',exact:true}).focus();
    await page.evaluate(()=>{window.__investigationFrames=[];let n=0;const read=()=>{window.__investigationFrames.push(document.querySelector('.react-flow__viewport')?.getAttribute('style'));if(++n<16)requestAnimationFrame(read);};requestAnimationFrame(read);});
    await page.keyboard.press('Enter'); await page.waitForFunction(()=>window.__investigationFrames.length===16);
    const frames=await page.evaluate(()=>window.__investigationFrames); assert(new Set(frames).size<=2,'Reduced-motion camera should not tween.');
    assert(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)); await calls(1);
    const selected=(await snapshot()).nodes.find(node=>node.id===cases.complete.ids.failure);assert(selected.bounds.width>=140);
  }
  evidence.checks.denseRouting=await denseRoutingCases();
  assert.deepEqual(evidence.blockedRequests,[]); assert.deepEqual(evidence.pageErrors,[]); assert.deepEqual(evidence.consoleErrors,[]);
  evidence.passed=true;
} catch(error) { evidence.error=error.stack; evidence.failureSnapshot=await snapshot().catch(()=>null); await capture('failure').catch(()=>{}); throw error; }
finally { writeFileSync(join(report,'verification.json'),JSON.stringify(evidence,null,2)+'\n');await browser.close(); }
console.log(JSON.stringify({passed:evidence.passed,browser:evidence.browser,checks:Object.keys(evidence.checks),screenshots:evidence.screenshots}));
