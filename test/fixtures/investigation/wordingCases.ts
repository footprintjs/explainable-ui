import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { InvestigationPanel } from '../../../src/components/InvestigationPanel/InvestigationPanel';
import { checkInvestigationAttention, checkInvestigationExplanation } from '../../../src/components/InvestigationPanel/admission';
import type { InvestigationPort } from '../../../src/components/InvestigationPanel/types';

// Frozen vocabulary supplied by this synthetic consumer, independent of the live wording owner.
const codes = ['not-collected','untracked-input','redacted','conservative','scope-boundary','invalid-data',
  'unavailable','timeout','cancelled','cycle','node-limit','depth-limit','edge-limit','call-limit','truncated',
  'strategy-failed','not-checked','no-match','ambiguous','stale','incompatible','unsupported','not-permitted'];
const kinds = ['error','unknown-effect','gave-up','timeout','retried','quality-drop','not-collected','outlier','custom-kind'];
export function wordingParityObservations() {
  const gaps = codes.map(code => ({code,nodeId:'selected',evidence:['recorded-ref']}));
  const marks = kinds.map(kind => ({kind,reason:'ERROR_RECORDED',evidence:['mark-ref']}));
  const attention = {nodes:[{nodeId:'selected',attention:marks}],confidence:'incomplete',gaps};
  const explanation = {nodeId:'selected',attention:marks,path:['selected'],alternatives:[],confidence:'incomplete',gaps,
    impact:{nodes:[],confidence:'complete',gaps:[]},
    backward:{nodes:['selected'],edges:[],confidence:'incomplete',gaps}};
  const port = {binding:{},attention,explain(){throw Error('No eager query is permitted');}} as InvestigationPort;
  const hostile = new Proxy({}, {getOwnPropertyDescriptor(){throw new Proxy({}, {get(){throw Error('Foreign error was inspected');}});}});
  let getterCalls = 0;
  const accessor = {nodes:[],confidence:'complete',get gaps(){getterCalls++;return [];}};
  const checks = {
    attention:checkInvestigationAttention(attention),
    explanation:checkInvestigationExplanation(explanation,'selected'),
    relationships:checkInvestigationExplanation(explanation,'selected','relationships'),
    unknownCode:checkInvestigationAttention({...attention,gaps:[{code:'unrecognized',evidence:[]}]}),
    inheritedCode:checkInvestigationAttention({...attention,gaps:[{code:'toString',evidence:[]}]}),
    overlong:checkInvestigationAttention({...attention,nodes:[{nodeId:'x'.repeat(2049),attention:[]}]}),
    accessor:checkInvestigationAttention(accessor),
    hostile:checkInvestigationAttention(hostile),
  };
  return {checks,getterCalls,
    overall:renderToStaticMarkup(createElement(InvestigationPanel,{port})),
    directional:renderToStaticMarkup(createElement(InvestigationPanel,{port,coverageMode:'directional'}))};
}
