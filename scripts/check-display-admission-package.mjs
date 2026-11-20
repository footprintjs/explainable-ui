/** Offline proof of the actual packed public checks. Run after the normal source build. */
import { graphConsumerPackages } from "./fixtures/graph-consumer-packages.mjs";
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, cpSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const repo = fileURLToPath(new URL('../', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'display-check-package-'));
const env = { PATH: process.env.PATH ?? '/usr/bin:/bin', TMPDIR: tmpdir(), CI: 'true',
  npm_config_offline: 'true', npm_config_cache: join(scratch, 'npm-cache'),
  npm_config_userconfig: join(scratch, 'empty-npmrc') };
function run(command, args, cwd = scratch) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout: 120_000 });
  if (result.status !== 0) throw Error(`${command} failed (${result.status})\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
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
  const consumer = `
const assert = require('node:assert/strict');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
for (const key of ['checkInvestigationAttention','checkInvestigationExplanation','checkFailureExplanationDisplay']) assert.equal(typeof api[key], 'function');
for (const key of ['DisplayReader','runDisplayCheck','readOwnField']) assert.equal(Object.hasOwn(api,key), false);
const section = text => ({text,wordingSource:'default',evidenceRefs:[]});
const value = {problem:section('P'),recordedCause:section('C'),suggestedNextStep:section('N'),unknowns:[],canonicalFindings:{causes:[],consequences:[],diagnosticFailures:[]}};
const checked = api.checkFailureExplanationDisplay(value); assert.equal(checked.ok,true); assert.deepEqual(checked.usage,{textCodeUnits:3,listItems:0});
const failureHtml = (explanation, emptyUnknownsText) =>
  renderToStaticMarkup(React.createElement(api.FailureExplanationView, { explanation, emptyUnknownsText }));
const oldHtml = failureHtml(value);
assert(oldHtml.includes('The supplied list is empty. This does not establish that everything is known. This view does not verify the underlying evidence.'));
const hostLine = '<Recorded check> & outcome';
const hostHtml = failureHtml(value, hostLine);
assert.match(hostHtml, /Host statement/);
assert(hostHtml.includes('&lt;Recorded check&gt; &amp; outcome'));
assert(!hostHtml.includes(hostLine));
assert(hostHtml.includes('This view does not verify the underlying evidence.'));
const withUnknown = {...value, unknowns: ['Result remains unknown']};
assert.equal(failureHtml(withUnknown, hostLine), failureHtml(withUnknown));
assert.equal(failureHtml({...value, emptyUnknownsText: hostLine}), oldHtml);
assert.equal(failureHtml(value, ''), oldHtml);
assert.equal(failureHtml(value, 'x'.repeat(api.failureExplanationDisplayLimits.maxReferenceOrUnknownCodeUnits + 1)), oldHtml);
assert.match(renderToStaticMarkup(React.createElement(api.FailureExplanationView,{explanation:value})),/data-section="problem"/);
const bad = {...value,canonicalFindings:{...value.canonicalFindings,causes:[{code:'PRIVATE lower code',summary:'PRIVATE SUMMARY',evidenceRefs:['PRIVATE REF']}]}};
const denied = api.checkFailureExplanationDisplay(bad); assert.equal(denied.ok,false);
assert.deepEqual(denied.diagnostic,{code:'invalid-code',path:['canonicalFindings','causes',0,'code']});
assert.equal('value' in denied,false); assert.equal('usage' in denied,false); assert(!JSON.stringify(denied).includes('PRIVATE'));
const refusedHtml=renderToStaticMarkup(React.createElement(api.FailureExplanationView,{explanation:bad}));
assert.match(refusedHtml,/cause and outcome remain unknown/); assert(!refusedHtml.includes('PRIVATE'));
assert(Object.isFrozen(api.failureExplanationDisplayLimits)); assert(Object.isFrozen(api.investigationDisplayLimits));
assert.equal(typeof api.failureExplanationDisplayLimits.findingCodePattern,'string');
assert.equal(Reflect.set(api.failureExplanationDisplayLimits,'findingCodePattern','.*'),false);
assert.equal(api.checkFailureExplanationDisplay(bad).ok,false);
const oversized={...value,unknowns:Array(1025).fill('u')};
assert.equal(api.checkFailureExplanationDisplay(oversized,{maxItemsPerList:100000}).ok,false);
let foreignReads=0;
const foreign=new Proxy({}, {get(){foreignReads++;throw Error('foreign get');},getPrototypeOf(){foreignReads++;throw Error('foreign prototype');}});
const unreadable={...value,problem:new Proxy({}, {getOwnPropertyDescriptor(){throw foreign;}})};
assert.deepEqual(api.checkFailureExplanationDisplay(unreadable).diagnostic,{code:'unreadable-input',path:[]}); assert.equal(foreignReads,0);
const attention={nodes:[{nodeId:'one',attention:[{kind:'host-signal',reason:'ERROR_RECORDED',evidence:['ref']}]}],confidence:'complete',gaps:[]};
assert.equal(api.checkInvestigationAttention(attention).ok,true);
let calls=0;const port={binding:{},attention,explain:()=>{calls++;throw Error('query must remain explicit');}};
renderToStaticMarkup(React.createElement(api.InvestigationPanel,{port}));assert.equal(calls,0);
const base={nodeId:'one',attention:[],path:['one','two'],alternatives:[],rootCause:'two',confidence:'complete',gaps:[],impact:{nodes:[],confidence:'complete',gaps:[]}};
let ignored=0;const textInput={...base,impact:{...base.impact}};
Object.defineProperty(textInput,'backward',{get(){ignored++;throw Error('ignored backward');}});
Object.defineProperty(textInput.impact,'edges',{get(){ignored++;throw Error('ignored impact edges');}});
assert.equal(api.checkInvestigationExplanation(textInput,'one').ok,true);assert.equal(ignored,0);
assert.equal(api.checkInvestigationExplanation(textInput,'one','relationships').ok,false);assert.equal(ignored,0);
assert.deepEqual(api.checkInvestigationExplanation(base,'different').diagnostic,{code:'selection-mismatch',path:['nodeId']});
const rich={...base,backward:{nodes:['one','two'],edges:[{from:'one',to:'two',kind:'data',attribution:'recorded-write',evidence:['ref']}],confidence:'complete',gaps:[]}};
assert.equal(api.checkInvestigationExplanation(rich,'one','relationships').ok,true);
const inconsistent={...rich,backward:{...rich.backward,confidence:'incomplete'}};
assert.equal(api.checkInvestigationExplanation(inconsistent,'one','relationships').ok,false);
const levels=['HIGH','MEDIUM','LOW','UNVERIFIED'];
const listNames=['causes','consequences','diagnosticFailures'];
function findings(withLevels){return Object.fromEntries(listNames.map(name=>[name,levels.map((level,index)=>({
  code:'RECORDED_'+index,summary:'<Recorded text> '+index,evidenceRefs:['<record-ref>'],...(withLevels?{level}:{})
}))]));}
const unlabelled={...value,canonicalFindings:findings(false)};
const labelled={...value,canonicalFindings:findings(true)};
const beforeLevels=api.checkFailureExplanationDisplay(unlabelled),afterLevels=api.checkFailureExplanationDisplay(labelled);
assert(beforeLevels.ok&&afterLevels.ok);
assert.equal(afterLevels.usage.textCodeUnits,beforeLevels.usage.textCodeUnits+3*levels.reduce((sum,level)=>sum+level.length,0));
assert.equal(afterLevels.usage.listItems,beforeLevels.usage.listItems);
for(const name of listNames){assert.deepEqual(afterLevels.value.canonicalFindings[name].map(f=>f.level),levels);
  assert.deepEqual(afterLevels.value.canonicalFindings[name].map(f=>f.code),labelled.canonicalFindings[name].map(f=>f.code));
  assert(Object.isFrozen(afterLevels.value.canonicalFindings[name][0]));}
const levelHtml=renderToStaticMarkup(React.createElement(api.FailureExplanationView,{explanation:labelled}));
for(const level of levels)assert(levelHtml.includes('Host level: '+level));
assert.equal(levelHtml.split('Finding levels are supplied by the host and are not verified by this view.').length-1,3);
assert(levelHtml.includes('data-fp-part="failure-finding-level"'));
assert(levelHtml.includes('&lt;Recorded text&gt;'));assert(levelHtml.includes('&lt;record-ref&gt;'));
assert(!levelHtml.includes('<Recorded text>'));
const plainHtml=renderToStaticMarkup(React.createElement(api.FailureExplanationView,{explanation:unlabelled}));
assert(!plainHtml.includes('Host level:'));assert(!plainHtml.includes('failure-finding-level'));
labelled.canonicalFindings.causes[0].level='LOW';assert.equal(afterLevels.value.canonicalFindings.causes[0].level,'HIGH');
const single=level=>({...value,canonicalFindings:{...value.canonicalFindings,causes:[{code:'VALID',summary:'S',evidenceRefs:[],level}]}});
for(const level of [null,'high','CRITICAL','',1,{toString(){throw Error('No coercion');}}]){
  const rejected=api.checkFailureExplanationDisplay(single(level));assert(!rejected.ok);
  assert.deepEqual(rejected.diagnostic,{code:'invalid-enum',path:['canonicalFindings','causes',0,'level']});
  assert(!('value' in rejected));assert(!('usage' in rejected));
  assert(renderToStaticMarkup(React.createElement(api.FailureExplanationView,{explanation:single(level)})).includes('cause and outcome remain unknown'));
}
let levelGetterReads=0;const accessor=single(undefined);
Object.defineProperty(accessor.canonicalFindings.causes[0],'level',{get(){levelGetterReads++;throw Error('No getter');}});
assert.deepEqual(api.checkFailureExplanationDisplay(accessor).diagnostic,{code:'accessor-field',path:['canonicalFindings','causes',0,'level']});
assert.equal(levelGetterReads,0);
const absent=single(undefined);const absentResult=api.checkFailureExplanationDisplay(absent);assert(absentResult.ok);
assert(!Object.hasOwn(absentResult.value.canonicalFindings.causes[0],'level'));
const inherited=single(undefined);delete inherited.canonicalFindings.causes[0].level;
Object.setPrototypeOf(inherited.canonicalFindings.causes[0],{get level(){levelGetterReads++;throw Error('No inherited getter');}});
assert.deepEqual(api.checkFailureExplanationDisplay(inherited),absentResult);assert.equal(levelGetterReads,0);
const bounded=single('HIGH');const initialCharge=api.checkFailureExplanationDisplay(bounded);assert(initialCharge.ok);
bounded.problem={...bounded.problem,text:'x'.repeat(api.failureExplanationDisplayLimits.maxTextCodeUnits-(initialCharge.usage.textCodeUnits-1))};
assert.equal(api.checkFailureExplanationDisplay(bounded).usage.textCodeUnits,api.failureExplanationDisplayLimits.maxTextCodeUnits);
bounded.problem.text+='x';assert.deepEqual(api.checkFailureExplanationDisplay(bounded).diagnostic,{
  code:'limit-exceeded',path:['canonicalFindings','causes',0,'level'],limit:'maxTextCodeUnits',maximum:262144,observed:262145});
for(const key of ['isFindingLevel','findingLevels','findingLevelVocabulary'])assert(!Object.hasOwn(api,key));
process.stdout.write(format+' actual packed host finding levels, whole refusal, readonly snapshots and exact text accounting passed.\\n');
process.stdout.write(format+' actual packed display checks, fixed bounds, inert exceptions and reader parity passed.\\n');
`;
  writeFileSync(join(scratch, 'consumer.cjs'), `const format='CJS';const api=require('footprint-explainable-ui');\n${consumer}`);
  process.stdout.write(run(process.execPath, ['consumer.cjs']));
  writeFileSync(join(scratch, 'consumer.mjs'), `import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const format='ESM';const api=await import('footprint-explainable-ui');\n${consumer}`);
  process.stdout.write(run(process.execPath, ['consumer.mjs']));
  const typeSource = `import {checkInvestigationAttention,checkInvestigationExplanation,checkFailureExplanationDisplay,investigationDisplayLimits,failureExplanationDisplayLimits,type InvestigationTextDisplay,type InvestigationRelationshipDisplay,type DisplayDiagnostic,type FailureExplanationDisplayFinding,type FailureExplanationViewProps,type InvestigationPort,type InvestigationResult} from 'footprint-explainable-ui';
const hostProps:FailureExplanationViewProps={emptyUnknownsText:'Operator checked the source reports.'};void hostProps;
// @ts-expect-error Only a string is accepted as host wording.
const callbackProps:FailureExplanationViewProps={emptyUnknownsText:()=> 'Host line'};void callbackProps;
// @ts-expect-error Optional host wording remains readonly.
hostProps.emptyUnknownsText='Changed';
const legacyFinding:FailureExplanationDisplayFinding={code:'RECORDED',summary:'Recorded text',evidenceRefs:[]};void legacyFinding;
const finding:FailureExplanationDisplayFinding={...legacyFinding,level:'HIGH'};
const allowed:NonNullable<FailureExplanationDisplayFinding['level']>='UNVERIFIED';void allowed;
// @ts-expect-error Unknown levels are outside the closed contract.
const invalidLevel:FailureExplanationDisplayFinding={...legacyFinding,level:'CRITICAL'};void invalidLevel;
// @ts-expect-error Values are not silently normalized.
const lower:FailureExplanationDisplayFinding={...legacyFinding,level:'high'};void lower;
// @ts-expect-error Admitted finding configuration is readonly.
finding.level='LOW';
// @ts-expect-error The private derived type is not a new root export.
import type {FindingLevel} from 'footprint-explainable-ui';
const failure=checkFailureExplanationDisplay({});
if(failure.ok){const level:FailureExplanationDisplayFinding['level']=failure.value.canonicalFindings.causes[0]?.level;void level;
// @ts-expect-error Checker projections retain readonly finding levels.
failure.value.canonicalFindings.causes[0]!.level='LOW';}
const raw:unknown={};const text=checkInvestigationExplanation(raw,'bound-id');const visual=checkInvestigationExplanation(raw,'bound-id','relationships');
if(text.ok){const projected:InvestigationTextDisplay=text.value;void projected;
// @ts-expect-error Text profile leaves backward relationships with the host.
text.value.backward;
// @ts-expect-error Text impact projection does not claim retained edges.
text.value.impact.edges;
// @ts-expect-error Detached display identifiers are readonly.
text.value.nodeId='other';
}else{const diagnostic:DisplayDiagnostic=text.diagnostic;void diagnostic;
// @ts-expect-error A refused model does not expose a partial value.
text.value;
// @ts-expect-error A refused model does not claim an exact whole-input cost.
text.usage;
}
if(visual.ok){const projected:InvestigationRelationshipDisplay=visual.value;void projected;}
type Edge=NonNullable<InvestigationRelationshipDisplay['backward']>['edges'][number];
const attributions=['per-write','stage','recorded-control','recorded-read','recorded-write'] as const;
const edges:readonly Edge[]=attributions.map(attribution=>({from:'one',to:'two',kind:attribution==='recorded-control'?'control':'data',attribution,evidence:[]}));void edges;
// @ts-expect-error Unknown attribution remains outside the display relationship contract.
const badAttribution:Edge['attribution']='invented';void badAttribution;
const oldResult:InvestigationResult={
  nodeId:'one',attention:[],path:['one'],alternatives:[],confidence:'complete',gaps:[],
  impact:{nodes:[],confidence:'complete',gaps:[]},
};
const backward:NonNullable<InvestigationRelationshipDisplay['backward']>={
  nodes:['one','two'],edges,confidence:'complete',gaps:[],
};
const richResult:InvestigationResult={...oldResult,backward};
const oldPort:InvestigationPort['explain']=()=>oldResult;
const syncPort:InvestigationPort['explain']=()=>richResult;
const asyncPort:InvestigationPort['explain']=async()=>richResult;
const projectedBackward:InvestigationRelationshipDisplay['backward']=richResult.backward;
void [oldPort,syncPort,asyncPort,projectedBackward];
// @ts-expect-error Only the two explicit existing projections are available.
checkInvestigationExplanation(raw,'bound-id','guess');
// @ts-expect-error Public fixed limits are readonly.
investigationDisplayLimits.maxTextCodeUnits=999999;
// @ts-expect-error Public preflight does not accept raised budgets.
checkFailureExplanationDisplay(raw,{maxItemsPerList:999999});
void [checkInvestigationAttention(raw),checkFailureExplanationDisplay(raw),failureExplanationDisplayLimits.findingCodePattern];
`;
  const modes = [];
  for (const [mode, extension] of [['NodeNext', 'mts'], ['NodeNext', 'cts'], ['Bundler', 'tsx']]) {
    const file = `types.${extension}`; writeFileSync(join(scratch, file), typeSource);
    const listed = run(process.execPath, [join(repo, 'node_modules/typescript/bin/tsc'), '--strict', '--skipLibCheck', 'false', '--noEmit', '--listFiles',
      '--module', mode === 'Bundler' ? 'ESNext' : 'NodeNext', '--moduleResolution', mode, '--target', 'ES2022', '--types', 'react,react-dom', file]);
    assert(!listed.includes('/node_modules/foottrace/')); assert(!listed.includes(join(repo, 'src')));
    modes.push(`${mode} ${extension}`);
  }
  process.stdout.write(JSON.stringify({ package: manifest.name, version: manifest.version, candidateOnly: true,
    packedIntegrity: packed.integrity, publicDoor: '.', formats: ['CJS','ESM'], strictTypes: modes, foottraceInstalled: false,
    privateReaderExported: false, wholeRefusalAndComponentParity: true, noBudgetOverride: true, hostFindingLevels: true,
    levelTextAccounting: true, privateLevelHelpersExported: false, hostEmptyUnknownsText: true, portBackwardEvidence: true })+'\n');
} finally { rmSync(scratch, { recursive: true, force: true }); }
