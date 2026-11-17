import { createElement } from 'react';
import { investigationGapMessage, InvestigationPanel, GroupedFlowInvestigation,
  type InvestigationPanelProps, type GroupedFlowInvestigationProps } from 'footprint-explainable-ui';
import { GroupedFlowInvestigation as FromFlowchart, type GroupedFlowInvestigationProps as GraphProps } from 'footprint-explainable-ui/flowchart';
import * as flowchart from 'footprint-explainable-ui/flowchart';
const labels: Readonly<Record<string, string>> = Object.freeze({ error: 'Recorded failure', 'custom-kind': 'Review needed' });
const panel: InvestigationPanelProps = { port: null, markLabels: labels };
const grouped: GroupedFlowInvestigationProps = { definition: { nodes: [], edges: [] }, markLabels: labels };
const portable: GraphProps = grouped;
createElement(InvestigationPanel, panel); createElement(GroupedFlowInvestigation, grouped); createElement(FromFlowchart, portable);
const sentence: string | undefined = investigationGapMessage('not-collected'); void sentence;
// @ts-expect-error Unknown codes may have no sentence.
const always: string = investigationGapMessage('not-collected'); void always;
// @ts-expect-error The public argument is text, not coercible arbitrary data.
investigationGapMessage(7);
// @ts-expect-error The function has exactly one public home.
flowchart.investigationGapMessage('not-collected');
// @ts-expect-error Component configuration is readonly.
panel.markLabels = labels;
// @ts-expect-error Host label entries are readonly through the component contract.
panel.markLabels!.error = 'Changed';
// @ts-expect-error Grouped shares the readonly map type.
portable.markLabels!.error = 'Changed';
// @ts-expect-error No numeric label values.
const invalid: InvestigationPanelProps = { markLabels: { error: 7 } }; void invalid;
// @ts-expect-error No callbacks or rendered elements.
const callback: GraphProps = { definition: { nodes: [], edges: [] }, markLabels: () => 'Name' }; void callback;
