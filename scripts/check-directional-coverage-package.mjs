/** Offline public-package proof; the normal CI build must run first. */
import { graphConsumerPackages } from "./fixtures/graph-consumer-packages.mjs";
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, cpSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const repo = fileURLToPath(new URL('../', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'directional-coverage-package-'));
const env = { PATH: process.env.PATH ?? '/usr/bin:/bin', TMPDIR: tmpdir(), CI: 'true',
  npm_config_offline: 'true', npm_config_cache: join(scratch, 'npm-cache'),
  npm_config_userconfig: join(scratch, 'empty-npmrc') };
function run(command, args, cwd = scratch) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout: 120_000 });
  if (result.status !== 0) throw Error(`${command} failed (${result.status}): ${result.stdout ?? ''} ${result.stderr ?? ''}`);
  return result.stdout;
}
try {
  const packed = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', scratch], repo))[0];
  const modules = join(scratch, 'node_modules'), destination = join(modules, 'footprint-explainable-ui');
  mkdirSync(destination, { recursive: true });
  run('tar', ['-xzf', join(scratch, packed.filename), '--strip-components=1', '-C', destination]);
  const manifest = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));
  for (const name of new Set([...graphConsumerPackages(manifest), 'csstype'])) {
    mkdirSync(dirname(join(modules, name)), { recursive: true });
    symlinkSync(join(repo, 'node_modules', name), join(modules, name), 'dir');
  }
  for (const name of ['react', 'react-dom']) cpSync(join(repo, 'node_modules/@types', name), join(modules, '@types', name), { recursive: true });
  writeFileSync(join(scratch, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  assert(!existsSync(join(modules, 'foottrace')));
  const runtime = `
const assert=require('node:assert/strict'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const entry=Object.freeze({code:'not-collected',nodeId:'supplied-item',evidence:Object.freeze(['<HOST-REF>'])});
let calls=0;const attention=Object.freeze({nodes:Object.freeze([{nodeId:'selection',attention:[]}]),confidence:'complete',gaps:Object.freeze([entry,entry])});
const port={binding:{},attention,explain(){calls++;throw Error('Unexpected eager query');}};
const before=JSON.stringify(attention);
const render=props=>renderToStaticMarkup(React.createElement(api.InvestigationPanel,{port,...props}));
const legacy=render({});assert.equal(legacy.split('Some evidence was not collected.').length-1,2);
assert(!legacy.includes('Attention evidence coverage'));
const directional=render({coverageMode:'directional'});
assert(directional.includes('Attention evidence coverage'));assert(directional.includes('2 supplied entries'));
assert(directional.includes('Source-reported confidence: complete.'));
assert.equal(directional.split('Some evidence was not collected.').length-1,1);
assert.equal(directional.split('&lt;HOST-REF&gt;').length-1,2);assert(!directional.includes('<HOST-REF>'));
const invalid=render({coverageMode:'secret-mode'});assert(invalid.includes('unavailable'));
assert(!invalid.includes('Investigate item 1'));assert(!invalid.includes('secret-mode'));
for(const door of [api,flowchart]){
  for(const key of ['CoverageSection','supportsRecordedRoot','groupGaps','resolveCoverageMode'])assert(!Object.hasOwn(door,key));
  const html=renderToStaticMarkup(React.createElement(door.GroupedFlowInvestigation,{
    definition:{nodes:[{id:'selection',label:'Selected'}],edges:[]},port,coverageMode:'secret-mode'}));
  assert(html.includes('unavailable'));assert(!html.includes('secret-mode'));
}
assert.equal(calls,0);assert.equal(JSON.stringify(attention),before);
process.stdout.write(format+' actual packed directional props, lossless attention groups, inert modes and default parity passed.'+String.fromCharCode(10));
`;
  const newline = String.fromCharCode(10);
  writeFileSync(join(scratch, 'consumer.cjs'), ["const format='CJS';const api=require('footprint-explainable-ui');const flowchart=require('footprint-explainable-ui/flowchart');", runtime].join(newline));
  process.stdout.write(run(process.execPath, ['consumer.cjs']));
  writeFileSync(join(scratch, 'consumer.mjs'), ["import{createRequire}from'node:module';const require=createRequire(import.meta.url);const format='ESM';const api=await import('footprint-explainable-ui');const flowchart=await import('footprint-explainable-ui/flowchart');", runtime].join(newline));
  process.stdout.write(run(process.execPath, ['consumer.mjs']));
  const types = `import{createElement}from'react';
import{InvestigationPanel,GroupedFlowInvestigation,type InvestigationPanelProps,type GroupedFlowInvestigationProps}from'footprint-explainable-ui';
import{GroupedFlowInvestigation as FromFlowchart,type GroupedFlowInvestigationProps as GraphProps}from'footprint-explainable-ui/flowchart';
const config={coverageMode:'directional'}as const;
const panel:InvestigationPanelProps={port:null,...config};
const grouped:GroupedFlowInvestigationProps={definition:{nodes:[],edges:[]},...config};
const portable:GraphProps=grouped;void portable;
createElement(InvestigationPanel,panel);createElement(GroupedFlowInvestigation,grouped);createElement(FromFlowchart,grouped);
const overall:InvestigationPanelProps={coverageMode:'overall'};void overall;
// @ts-expect-error The public setting is closed, not an arbitrary direction or strategy.
const bad:InvestigationPanelProps={coverageMode:'sideways'};void bad;
// @ts-expect-error Grouped and standalone use the same public mode vocabulary.
const badGrouped:GraphProps={definition:{nodes:[],edges:[]},coverageMode:'sideways'};void badGrouped;
// @ts-expect-error Consumer configuration cannot mutate readonly component props.
panel.coverageMode='overall';
`;
  const modes = [];
  for (const [mode, extension] of [['NodeNext', 'mts'], ['NodeNext', 'cts'], ['Bundler', 'tsx']]) {
    const file = `types.${extension}`; writeFileSync(join(scratch, file), types);
    const listed = run(process.execPath, [join(repo, 'node_modules/typescript/bin/tsc'), '--strict', '--skipLibCheck', 'false', '--noEmit', '--listFiles',
      '--module', mode === 'Bundler' ? 'ESNext' : 'NodeNext', '--moduleResolution', mode, '--target', 'ES2022', '--types', 'react,react-dom', file]);
    assert(!listed.includes('/node_modules/foottrace/')); assert(!listed.includes(join(repo, 'src')));
    modes.push(`${mode} ${extension}`);
  }
  process.stdout.write(JSON.stringify({package:manifest.name,version:manifest.version,candidateOnly:true,packedIntegrity:packed.integrity,
    publicDoors:['.','./flowchart'],formats:['CJS','ESM'],strictTypes:modes,foottraceInstalled:false,
    privateHelpersExported:false,legacyDefaultParity:true,losslessAttentionGroups:true,noEagerQueries:true})+newline);
} finally { rmSync(scratch, { recursive: true, force: true }); }
