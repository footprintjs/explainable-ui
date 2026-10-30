import { useEffect, useMemo, useState } from 'react';
import { GroupedFlowInvestigation } from '../../src/components/GroupedFlowInvestigation';
import { FootprintTheme, warmLight, type ThemeTokens } from '../../src/theme';
import { createRecordedInvestigationExample, type ExampleRecording } from './recorded';

const theme: ThemeTokens = { ...warmLight, colors: { ...warmLight.colors,
  primary: '#75658e', accent: '#ca7448', accentBg: 'rgba(202,116,72,.10)', success: '#427d67', error: '#b85d43',
  warning: '#ca7448', nodeVisited: '#427d67', nodeMain: '#75658e', tracing: '#3d8176',
  bg: '#fbfaf5', bgPrimary: '#fbfaf5', bgElevated: '#fffef9', bgSecondary: '#f2eee5', bgTertiary: '#e8e5d9',
  border: '#d8d7c9', textPrimary: '#343b35', textSecondary: '#62685e', textMuted: '#777e72',
}, radius: '16px' };
const descriptions: Record<ExampleRecording, string> = {
  complete: 'A saved recording of an order that ended without a shipping option.',
  missing: 'A copy of the recording with incomplete capture coverage.',
  ambiguous: 'A recording with two independent business-rule findings.',
};

export function RecordedInvestigationExample() {
  const [recording, setRecording] = useState<ExampleRecording>('complete');
  const [queryCount, setQueryCount] = useState(0);
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');
  const sample = useMemo(() => createRecordedInvestigationExample(recording, () => setQueryCount(value => value + 1)), [recording]);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const update = () => setDirection(query.matches ? 'TB' : 'LR');
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return <FootprintTheme tokens={theme}><div className="investigation-example">
    <style>{styles}</style>
    <header><a href="#flow" className="wordmark"><span aria-hidden="true">↳</span> Flow study</a><span className="sample-badge">Offline recorded example</span></header>
    <main>
      <div className="intro"><p className="eyebrow">FROM THE PROBLEM TO ITS RECORDED ORIGIN</p>
        <h1>A problem, traced back.</h1><p>Click <strong>No shipping option</strong>. Follow the recorded evidence to its supported cause.</p></div>
      <section className="recording-picker" aria-label="Example recording">
        <div><label htmlFor="recording">Recording to inspect</label><select id="recording" value={recording} onChange={event => { setRecording(event.target.value as ExampleRecording); setQueryCount(0); }}>
          <option value="complete">Complete recording</option><option value="missing">Missing capture evidence</option><option value="ambiguous">Two possible causes</option>
        </select></div><p>{descriptions[recording]}</p><span className="query-count" role="status">Analysis calls: <output data-testid="analysis-count">{queryCount}</output></span>
      </section>
      <section id="flow" className="flow-card" aria-label="Recorded flow and investigation">
        <GroupedFlowInvestigation key={recording} definition={sample.definition} observation={sample.observation} port={sample.port} direction={direction} aria-label="Recorded order flow with click-to-investigate failures" />
      </section>
      <aside className="reading-notes" aria-label="How to read this example"><div><h2>Execution is different from cause</h2><p>A completed step can return an unusable result. Here, Shipping rates completed but returned no options. That recorded business-rule issue is not proof of a carrier's internal fault.</p></div>
        <div><h2>One result, two views</h2><p>Cause and impact use the same analysis result. Switching views should leave the analysis-call count unchanged. The Payment group is unrelated to this recorded dependency.</p></div></aside>
      <footer>Synthetic saved commits, read by canonical Foottrace code. No application or AI provider is called.</footer>
    </main>
  </div></FootprintTheme>;
}

const styles = `
* { box-sizing: border-box; }
body { margin: 0; background: #f7f5ed; color: #343b35; }
.investigation-example { min-height: 100vh; font-family: ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; background: radial-gradient(ellipse at 92% 1%,#e6eddf 0,transparent 34%),radial-gradient(ellipse at 1% 50%,#f5e7d6 0,transparent 36%); }
.investigation-example header { max-width: 1320px; margin: auto; padding: 28px 46px; display: flex; justify-content: space-between; align-items: center; gap: 18px; border-bottom: 1px solid #d8d7c9; }
.wordmark { font-size: 16px; font-weight: 750; color: #343b35; text-decoration: none; }.wordmark span { color: #7b8a6e; font-size: 32px; vertical-align: middle; margin-right: 8px; }
.sample-badge { padding: 8px 13px; border: 1px solid #d8d7c9; border-radius: 30px; color: #626d58; font-size: 11px; font-weight: 650; }
.investigation-example main { max-width: 1320px; margin: 0 auto; padding: 46px; }.intro { margin-bottom: 30px; }.eyebrow { font-size: 9px; font-weight: 750; letter-spacing: 2px; color: #777e72; margin: 0 0 12px; }
.intro h1 { font: 500 clamp(34px,4vw,52px)/1.08 Georgia,serif; letter-spacing: -2px; margin: 0 0 14px; }.intro>p:last-child { font-size: 14px; line-height: 1.6; color: #62685e; }
.recording-picker { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; padding: 20px 24px; border: 1px solid #d8d7c9; border-radius: 16px; background: #fbfaf5; margin-bottom: 20px; }.recording-picker>div { display: grid; gap: 8px; }.recording-picker label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.1px; font-weight: 700; }.recording-picker select { font: inherit; font-size: 13px; color: inherit; padding: 9px 30px 9px 12px; border: 1px solid #d8d7c9; background: #fffef9; border-radius: 8px; max-width: 100%; }.recording-picker>p { flex: 1; min-width: 200px; font-size: 12px; line-height: 1.6; color: #62685e; }.query-count { font-size: 11px; color: #62685e; white-space: nowrap; }
.flow-card { padding: 22px; border: 1px solid #d8d7c9; border-radius: 22px; background: #fbfaf5; box-shadow: 0 12px 36px rgba(0,0,0,.035); min-width: 0; }.flow-card>section { min-width: 0; }
.reading-notes { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }.reading-notes>div { padding: 22px; border: 1px solid #dedbce; border-radius: 16px; background: #f5f1e7; }.reading-notes h2 { font-size: 13px; margin: 0 0 10px; }.reading-notes p { font-size: 12px; line-height: 1.7; color: #62685e; margin: 0; }.investigation-example footer { color: #777e72; font-size: 10px; margin: 28px 0 0; line-height: 1.6; }
.investigation-example button:focus-visible,.investigation-example select:focus-visible { outline: 3px solid #3d8176; outline-offset: 3px; }
@media(max-width:640px) { .investigation-example header { padding: 18px; }.sample-badge { font-size: 9px; }.investigation-example main { padding: 28px 14px; }.intro h1 { letter-spacing: -1px; }.recording-picker { padding: 16px; gap: 10px; }.recording-picker>p { min-width: 0; flex-basis: 100%; }.flow-card { padding: 10px; border-radius: 16px; }.reading-notes { grid-template-columns: 1fr; }.wordmark { font-size: 14px; } }
`;
