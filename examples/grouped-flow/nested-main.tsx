import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import { GroupedFlowDiagram } from '../../src/components/GroupedFlowDiagram/GroupedFlowDiagram';
import type { FlowDiagramDefinition, FlowDiagramObservation } from '../../src/components/GroupedFlowDiagram/types';
import { FootprintTheme, warmLight } from '../../src/theme';

const definition = {
  nodes: [
    { id: 'order', label: 'Order', kind: 'group', icon: 'flow' },
    { id: 'pay-a', label: 'Payment', kind: 'group', parentId: 'order', icon: 'card' },
    { id: 'pay-b', label: 'Payment', kind: 'group', parentId: 'order', icon: 'card' },
    { id: 'a1', label: 'Validate', parentId: 'pay-a', icon: 'step' },
    { id: 'a2', label: 'Validate', parentId: 'pay-a', icon: 'step' },
    { id: 'b1', label: 'Validate', parentId: 'pay-b', icon: 'step' },
  ],
  edges: [
    { id: 'a1-a2', source: 'a1', target: 'a2' },
    { id: 'a2-b1', source: 'a2', target: 'b1' },
  ],
} satisfies FlowDiagramDefinition;

// Group states are intentionally absent. A child's state is not its group's state.
const observation = {
  nodeStates: { a1: 'completed', a2: 'completed', b1: 'failed' },
  edgeStates: { 'a1-a2': 'observed', 'a2-b1': 'observed' },
} satisfies FlowDiagramObservation;

function RepeatedFlowsExample() {
  const [expandedGroupIds, setExpandedGroupIds] = useState<readonly string[]>(['order']);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = definition.nodes.find((node) => node.id === selectedNodeId);

  return (
    <FootprintTheme tokens={warmLight}>
      <main className="nested-example">
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; background: #faf5ef; color: #2e2938; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          .nested-example { max-width: 1220px; margin: 0 auto; padding: 38px 28px; }
          .nested-example header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 12px; }
          .nested-example h1 { margin: 0; font: 400 clamp(28px, 4vw, 39px)/1.2 Georgia, serif; letter-spacing: -.8px; }
          .nested-example .recording-badge { border: 1px solid #d6c8b4; border-radius: 99px; color: #655d6b; background: #f0e6d6; padding: 6px 11px; font-size: 11px; white-space: nowrap; }
          .nested-example p { max-width: 720px; font-size: 13px; line-height: 1.7; color: #6d6376; }
          .nested-example .canvas-card { margin: 24px 0 17px; overflow: hidden; border: 1px solid #d6c8b4; border-radius: 18px; background: #fffaf3; }
          .nested-example output { display: block; min-height: 42px; border: 1px solid #d6c8b4; background: #f5eee2; border-radius: 9px; padding: 10px 13px; font-size: 12px; }
          .nested-example .observation-note { font-size: 11px; margin-top: 13px; }
          @media (max-width: 600px) { .nested-example { padding: 26px 14px; } .nested-example header { align-items: flex-start; flex-direction: column; gap: 12px; } }
        `}</style>
        <header>
          <h1>Repeated flows and steps</h1>
          <span className="recording-badge">Example recording · Synthetic</span>
        </header>
        <p>Expand each Payment group, then select a Validate step. The repeated names belong to separate instances inside Order.</p>
        <div className="canvas-card">
          <GroupedFlowDiagram
            definition={definition}
            observation={observation}
            expandedGroupIds={expandedGroupIds}
            onExpandedGroupIdsChange={setExpandedGroupIds}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            direction="LR"
            style={{ height: 600, background: 'transparent' }}
            aria-label="Synthetic nested Order with two separate Payment groups and three separate Validate steps"
          />
        </div>
        <output data-selected-id={selectedNodeId ?? ''} aria-live="polite">
          {selectedNode ? `Selected: ${selectedNode.label}` : 'Open a group, then select a step to inspect it.'}
        </output>
        <p className="observation-note">Only the Validate steps have recorded states. Group states remain Unknown. This fixed synthetic example runs entirely offline.</p>
      </main>
    </FootprintTheme>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RepeatedFlowsExample />
  </StrictMode>,
);
