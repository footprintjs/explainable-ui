import { useEffect, useState } from 'react';
import { GroupedFlowDiagram } from '../../src/components/GroupedFlowDiagram/GroupedFlowDiagram';
import { FootprintTheme, warmLight } from '../../src/theme';
import type { ThemeTokens } from '../../src/theme';
import {
  exampleDefinition,
  exampleNodeDetails,
  exampleObservation,
  exampleProblem,
  exampleProblemHighlight,
  stateLabels,
} from './fixture';

const exampleTheme: ThemeTokens = {
  ...warmLight,
  colors: {
    ...warmLight.colors,
    primary: '#75658e',
    accent: '#ca7448',
    accentBg: 'rgba(202,116,72,.10)',
    success: '#427d67',
    error: '#b85d43',
    warning: '#ca7448',
    nodeVisited: '#427d67',
    nodeMain: '#75658e',
    tracing: '#3d8176',
    bg: '#fbfaf5',
    bgPrimary: '#fbfaf5',
    bgElevated: '#fffef9',
    bgSecondary: '#f2eee5',
    bgTertiary: '#e8e5d9',
    border: '#d8d7c9',
    textPrimary: '#343b35',
    textSecondary: '#62685e',
    textMuted: '#777e72',
  },
  radius: '16px',
  fontFamily: { sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
};

export function GroupedFlowExample() {
  const [expandedGroupIds, setExpandedGroupIds] = useState<readonly string[]>(['payment1']);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('failure1');
  const [tracingProblem, setTracingProblem] = useState(false);
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mobileQuery = window.matchMedia('(max-width: 640px)');
    const updateDirection = () => setDirection(mobileQuery.matches ? 'TB' : 'LR');
    updateDirection();
    mobileQuery.addEventListener('change', updateDirection);
    return () => mobileQuery.removeEventListener('change', updateDirection);
  }, []);

  const paymentExpanded = expandedGroupIds.includes('payment1');
  const selectedNode = exampleDefinition.nodes.find((node) => node.id === selectedNodeId);
  const selectedState = exampleObservation.nodeStates[selectedNodeId as keyof typeof exampleObservation.nodeStates] ?? 'unknown';

  function traceProblem() {
    setSelectedNodeId(exampleProblem.selectedNodeId);
    setTracingProblem(true);
  }

  return (
    <FootprintTheme tokens={exampleTheme}>
      <div className="grouped-flow-example">
        <style>{styles}</style>
        <header className="example-topbar">
          <a className="example-wordmark" href="#flow" aria-label="Go to example flow">
            <span className="example-mark" aria-hidden="true"><i /><i /><i /></span>
            Flow study
          </a>
          <span className="example-recording-badge"><span aria-hidden="true" />Example recording</span>
        </header>

        <main>
          <section className="example-intro" aria-labelledby="example-title">
            <div>
              <p className="example-eyebrow">THE BIG PICTURE. THE SMALL DETAILS.</p>
              <h1 id="example-title">A flow, with room for detail.</h1>
              <p className="example-subtitle">Follow the recorded path. Open a group to see the steps inside.</p>
            </div>
            <div className="example-recording-note">
              <span className="example-note-icon" aria-hidden="true">↳</span>
              <p>A small, synthetic recording.<br /><strong>Ready to explore, entirely offline.</strong></p>
            </div>
          </section>

          <section className="example-flow-card" id="flow" aria-labelledby="flow-title">
            <div className="example-flow-toolbar">
              <div className="example-flow-title">
                <span className="example-section-number" aria-hidden="true">01</span>
                <div><h2 id="flow-title">Flow overview</h2><p>8 steps <span aria-hidden="true">·</span> 1 reusable group</p></div>
              </div>
              <button
                className="example-button example-button-quiet"
                type="button"
                aria-expanded={paymentExpanded}
                onClick={() => setExpandedGroupIds(paymentExpanded ? [] : ['payment1'])}
              >
                <span aria-hidden="true">{paymentExpanded ? '−' : '+'}</span>
                {paymentExpanded ? 'Collapse payment' : 'Expand payment'}
              </button>
            </div>

            <div className="example-diagram-stage">
              <div className="example-canvas-caption" aria-hidden="true"><span />An expandable flow</div>
              <GroupedFlowDiagram
                definition={exampleDefinition}
                observation={exampleObservation}
                highlight={tracingProblem ? exampleProblemHighlight : undefined}
                selectedNodeId={selectedNodeId}
                expandedGroupIds={expandedGroupIds}
                onExpandedGroupIdsChange={setExpandedGroupIds}
                onSelectNode={setSelectedNodeId}
                direction={direction}
                aria-label="Synthetic recorded flow from Cart through Payment and Shipping rates, with No shipping option recorded as failed"
                className="example-diagram"
                style={{ height: 460, minHeight: 320, background: 'transparent' }}
              />
              <p className="example-canvas-hint">Select a step for its recorded details. Use the diagram controls to zoom.</p>
            </div>

            <div className="example-legend" aria-label="Recorded state legend">
              <span className="example-legend-label">RECORDED STATE</span>
              <span><i className="example-dot example-dot-completed" />Completed</span>
              <span><i className="example-dot example-dot-failed" />Failed</span>
              <span><i className="example-dot example-dot-not-run" />Not run</span>
              <span><i className="example-dot example-dot-unknown" />Unknown</span>
              <span className="example-legend-note">Missing observations stay unknown.</span>
            </div>
          </section>

          <div className="example-details-grid">
            <section className="example-detail-card" aria-labelledby="selected-step-title">
              <p className="example-eyebrow">SELECTED STEP</p>
              <div className="example-detail-heading">
                <h2 id="selected-step-title">{selectedNode?.label ?? 'Select a step'}</h2>
                <span className={`example-state-pill example-state-${selectedState}`}>{stateLabels[selectedState]}</span>
              </div>
              <p>{exampleNodeDetails[selectedNodeId] ?? 'Select any step in the diagram to inspect its supplied observation.'}</p>
              {selectedNode?.kind === 'group' && <span className="example-detail-footnote">Tip: open this group to select either step inside.</span>}
            </section>

            <section className={`example-problem-card${tracingProblem ? ' example-problem-active' : ''}`} aria-labelledby="problem-title">
              <div className="example-problem-heading">
                <span className="example-problem-symbol" aria-hidden="true">!</span>
                <div><p className="example-eyebrow">A CLOSER LOOK</p><h2 id="problem-title">One recorded problem</h2></div>
              </div>
              <div aria-live="polite" className="example-problem-copy">
                {tracingProblem
                  ? <p>{exampleProblem.explanation}</p>
                  : <p>See the supplied observations leading to <strong>No shipping option</strong>.</p>}
              </div>
              <div className="example-trace-actions">
                <button className="example-button example-button-primary" type="button" onClick={traceProblem}>
                  <span aria-hidden="true">↳</span>Trace this problem<span aria-hidden="true">↗</span>
                </button>
                {tracingProblem && <button type="button" className="example-clear-trace" onClick={() => setTracingProblem(false)}>Clear trace</button>}
              </div>
              {tracingProblem && <p className="example-trace-note">Highlighting 3 supplied steps and 2 observed connections.</p>}
            </section>
          </div>

          <footer className="example-footer">
            <span className="example-footer-flower" aria-hidden="true">✳</span>
            <p>Built from fixed example data. “Completed” describes a step’s execution state in this recording.</p>
            <span className="example-offline"><span aria-hidden="true" />No connection needed</span>
          </footer>
        </main>
      </div>
    </FootprintTheme>
  );
}

const styles = `
  * { box-sizing: border-box; }
  html { min-width: 320px; background: #f7f5ee; scroll-behavior: smooth; }
  body { margin: 0; }
  button, a { -webkit-tap-highlight-color: transparent; }
  button { font: inherit; }
  button:focus-visible, a:focus-visible { outline: 3px solid #3d8176; outline-offset: 4px; }
  .grouped-flow-example { min-height: 100vh; color: #343b35; font: 14px/1.55 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(ellipse 60% 42% at 98% 2%, #e9eee1 0%, transparent 80%), radial-gradient(ellipse 60% 60% at 0% 55%, #f5e9dd 0%, transparent 75%), #f7f5ee; }
  .example-topbar { max-width: 1320px; padding: 25px 48px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #dcded2; }
  .example-wordmark { display: inline-flex; align-items: center; gap: 12px; color: #343b35; font-size: 17px; font-weight: 650; letter-spacing: -.5px; text-decoration: none; }
  .example-mark { width: 28px; height: 28px; display: flex; align-items: center; gap: 3px; transform: rotate(-15deg); }
  .example-mark i { display: block; width: 7px; border-radius: 6px; background: #76876d; }
  .example-mark i:nth-child(1) { height: 15px; }
  .example-mark i:nth-child(2) { height: 26px; }
  .example-mark i:nth-child(3) { height: 20px; }
  .example-recording-badge { padding: 6px 12px; display: inline-flex; gap: 7px; align-items: center; border: 1px solid #d2d7c9; border-radius: 99px; background: #edf0e5; color: #58634f; font-size: 11px; font-weight: 650; }
  .example-recording-badge > span, .example-offline > span { width: 6px; height: 6px; background: #71866c; border-radius: 50%; }
  .grouped-flow-example main { max-width: 1320px; margin: 0 auto; padding: 0 48px; }
  .example-intro { display: flex; justify-content: space-between; gap: 32px; align-items: flex-end; padding: 47px 0 34px; }
  .example-eyebrow { color: #777e70; letter-spacing: 1.5px; font-size: 9px; font-weight: 750; margin: 0 0 8px; }
  .example-intro h1 { margin: 0 0 9px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(32px, 3.5vw, 47px); letter-spacing: -1.8px; font-weight: 400; line-height: 1.13; }
  .example-subtitle { margin: 0; font-size: 13px; color: #767b70; }
  .example-recording-note { display: flex; gap: 12px; align-items: center; padding-bottom: 2px; flex-shrink: 0; }
  .example-recording-note p { color: #8a8f81; font-size: 10px; line-height: 1.8; margin: 0; }
  .example-recording-note strong { font-weight: 500; color: #626c5d; }
  .example-note-icon { color: #a4ad97; font: 36px Georgia, serif; }
  .example-flow-card { overflow: hidden; border: 1px solid #d7d9ca; background: #fbfaf5; border-radius: 20px; box-shadow: 0 8px 28px #3d493807, 0 1px 2px #3d493804; }
  .example-flow-toolbar { min-height: 79px; padding: 19px 25px; display: flex; justify-content: space-between; align-items: center; gap: 16px; border-bottom: 1px solid #e4e4d8; }
  .example-flow-title { display: flex; gap: 13px; align-items: center; }
  .example-section-number { width: 30px; height: 30px; display: grid; place-items: center; background: #efeee6; color: #939585; border: 1px solid #e2e1d4; border-radius: 9px; font-size: 10px; }
  .example-flow-title h2 { font-size: 13px; font-weight: 650; line-height: 1.4; margin: 0 0 2px; }
  .example-flow-title p { color: #8b8e80; margin: 0; font-size: 10px; }
  .example-flow-title p > span { padding: 0 4px; }
  .example-button { border: 0; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 8px; font-size: 11px; line-height: 1.3; font-weight: 600; transition: background 120ms ease, box-shadow 120ms ease; }
  .example-button-quiet { padding: 9px 11px; background: #f4f3ec; color: #707765; border: 1px solid #dfdfd2; }
  .example-button-quiet:hover { background: #eaece1; }
  .example-button-quiet > span { font-size: 16px; font-weight: 400; line-height: .7; }
  .example-diagram-stage { position: relative; min-height: 510px; padding: 40px 0 0; background: radial-gradient(ellipse 35% 80% at 12% 70%, #f2e3d32b, transparent), radial-gradient(ellipse 45% 80% at 100% 10%, #e5eddd3b, transparent), #fbfaf5; }
  .example-canvas-caption { position: absolute; left: 26px; top: 24px; display: flex; align-items: center; gap: 6px; color: #a0a28e; font-size: 9px; font-weight: 500; }
  .example-canvas-caption > span { width: 5px; height: 5px; border-radius: 50%; background: #afb69d; }
  .example-canvas-hint { margin: 0; padding: 0 26px 17px; color: #999c8c; font-size: 9px; }
  .example-legend { border-top: 1px solid #e4e4d8; display: flex; align-items: center; gap: 18px; padding: 15px 26px; flex-wrap: wrap; background: #f6f5ee; color: #737a6a; font-size: 9px; }
  .example-legend > span { display: inline-flex; align-items: center; gap: 6px; }
  .example-legend .example-legend-label { font-size: 8px; letter-spacing: 1px; color: #949785; font-weight: 600; margin-right: 6px; }
  .example-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; }
  .example-dot-completed { background: #65917c; }
  .example-dot-failed { background: #be7658; }
  .example-dot-not-run { border: 1px solid #a9ae9e; background: #eeeee6; }
  .example-dot-unknown { border: 1px dashed #9fa596; background: transparent; }
  .example-legend .example-legend-note { margin-left: auto; color: #969b8a; font-size: 9px; }
  .example-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 20px 0 0; }
  .example-detail-card, .example-problem-card { padding: 22px 25px; border: 1px solid #d9dccf; border-radius: 14px; background: #fbfaf5b8; min-height: 174px; }
  .example-detail-heading { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 7px; }
  .example-detail-card h2, .example-problem-card h2 { margin: 0; color: #48513f; font-size: 15px; font-weight: 550; letter-spacing: -.3px; line-height: 1.4; }
  .example-detail-card > p:not(.example-eyebrow), .example-problem-copy p { margin: 7px 0 0; color: #7d8372; font-size: 11px; line-height: 1.75; max-width: 470px; }
  .example-detail-footnote { font-size: 10px; color: #89917e; display: block; margin-top: 8px; }
  .example-state-pill { padding: 3px 7px; border-radius: 5px; border: 1px solid #dcdfd3; font-size: 8px; font-weight: 650; background: #f0f0e8; color: #818777; }
  .example-state-completed { background: #eaf0e5; border-color: #d5e0cd; color: #52725b; }
  .example-state-failed { background: #f6e8dd; border-color: #eacbb5; color: #ab6546; }
  .example-state-unknown { border-style: dashed; }
  .example-problem-card { background: #f3eee2b3; border-color: #e2dac9; position: relative; }
  .example-problem-active { background: #eef2e9; border-color: #bfd2be; }
  .example-problem-heading { display: flex; gap: 11px; align-items: center; }
  .example-problem-symbol { width: 28px; height: 28px; border-radius: 9px; border: 1px solid #e4cfb4; background: #f0e2d0; color: #b18257; display: grid; place-items: center; font-size: 14px; font-family: Georgia, serif; }
  .example-problem-heading .example-eyebrow { font-size: 8px; letter-spacing: 1.2px; margin: 0 0 2px; }
  .example-problem-copy { min-height: 28px; }
  .example-problem-copy strong { font-weight: 550; color: #656f59; }
  .example-trace-actions { display: flex; gap: 13px; align-items: center; margin-top: 13px; }
  .example-button-primary { background: #77886a; color: #fffef7; box-shadow: inset 0 0 0 1px #4e664126; padding: 9px 12px; font-size: 10px; }
  .example-button-primary:hover { background: #637858; }
  .example-button-primary > span:last-child { padding-left: 14px; opacity: .8; }
  .example-clear-trace { border: 0; background: transparent; color: #6c7e61; text-decoration: underline; text-underline-offset: 3px; font-size: 9px; padding: 5px 0; cursor: pointer; }
  .example-trace-note { margin: 8px 0 0; font-size: 9px; color: #6c826b; }
  .example-footer { display: flex; gap: 9px; align-items: center; margin: 19px 2px 0; padding-bottom: 29px; color: #959b8b; }
  .example-footer p { font-size: 9px; margin: 0; }
  .example-footer-flower { font-size: 20px; color: #9aa78d; line-height: 1; }
  .example-offline { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; color: #929c85; font-size: 9px; }
  @media (min-width: 1450px) { .example-intro { padding-top: 57px; padding-bottom: 41px; } }
  @media (max-width: 900px) { .example-topbar { padding: 23px 25px; } .grouped-flow-example main { padding: 0 25px; } .example-intro { padding-top: 35px; } .example-recording-note { display: none; } .example-legend { gap: 13px; } .example-legend .example-legend-note { width: 100%; margin-left: 0; } .example-offline { display: none; } }
  @media (max-width: 600px) { .example-topbar { padding: 19px 18px; } .grouped-flow-example main { padding: 0 14px; } .example-wordmark { font-size: 15px; } .example-recording-badge { font-size: 9px; padding: 5px 8px; } .example-intro { padding: 31px 5px 23px; } .example-intro h1 { letter-spacing: -1.2px; font-size: 33px; max-width: 300px; } .example-eyebrow { font-size: 8px; letter-spacing: 1.2px; } .example-subtitle { font-size: 11px; max-width: 280px; } .example-flow-card { border-radius: 14px; } .example-flow-toolbar { padding: 15px; min-height: 72px; } .example-section-number { display: none; } .example-button-quiet { font-size: 9px; padding: 8px; gap: 5px; } .example-flow-title h2 { font-size: 12px; } .example-flow-title p { font-size: 8px; } .example-diagram-stage { min-height: 470px; padding-top: 27px; } .example-canvas-caption { left: 16px; top: 15px; font-size: 8px; } .example-diagram { height: 420px !important; } .example-canvas-hint { padding: 0 15px 15px; font-size: 8px; } .example-legend { padding: 12px 15px; gap: 10px 13px; font-size: 8px; } .example-legend .example-legend-label { width: 100%; margin-right: 0; } .example-legend .example-legend-note { font-size: 8px; } .example-details-grid { grid-template-columns: 1fr; gap: 12px; margin-top: 13px; } .example-detail-card, .example-problem-card { padding: 20px; min-height: auto; } .example-detail-card > p:not(.example-eyebrow), .example-problem-copy p { font-size: 11px; } .example-footer { align-items: flex-start; gap: 8px; margin: 18px 6px 0; } .example-footer p { font-size: 8px; } }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } .example-button { transition: none; } }
`;
