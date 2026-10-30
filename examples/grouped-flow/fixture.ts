import type {
  FlowDiagramDefinition,
  FlowDiagramHighlight,
  FlowDiagramObservation,
  FlowDiagramNodeState,
} from '../../src/components/GroupedFlowDiagram/types';

/**
 * Entirely synthetic, app-approved structure. The arrows describe available
 * transitions; they do not establish which transition a recording took.
 */
export const exampleDefinition = {
  nodes: [
    { id: 'cart1', label: 'Cart', icon: 'cart', description: 'The starting step in this example.' },
    { id: 'payment1', label: 'Payment', kind: 'group', icon: 'card', description: 'A reusable group with two steps.' },
    { id: 'authorize1', label: 'Authorize', parentId: 'payment1', icon: 'lock' },
    { id: 'capture1', label: 'Capture', parentId: 'payment1', icon: 'payment' },
    { id: 'shipping1', label: 'Shipping rates', icon: 'shipping' },
    { id: 'rates1', label: 'Rates found?', kind: 'decision' },
    { id: 'label1', label: 'Label', icon: 'label' },
    { id: 'confirmation1', label: 'Confirmation', icon: 'step' },
    { id: 'failure1', label: 'No shipping option', icon: 'alert' },
  ],
  edges: [
    { id: 'cart-authorize', source: 'cart1', target: 'authorize1' },
    { id: 'authorize-capture', source: 'authorize1', target: 'capture1' },
    { id: 'capture-shipping', source: 'capture1', target: 'shipping1' },
    { id: 'shipping-rates', source: 'shipping1', target: 'rates1' },
    { id: 'rates-yes', source: 'rates1', target: 'label1', label: 'Yes' },
    { id: 'label-confirmation', source: 'label1', target: 'confirmation1' },
    { id: 'rates-no', source: 'rates1', target: 'failure1', label: 'No' },
  ],
} satisfies FlowDiagramDefinition;

/** All states below are supplied observations, never inferred from the design. */
export const exampleObservation = {
  nodeStates: {
    cart1: 'completed',
    payment1: 'completed',
    authorize1: 'completed',
    capture1: 'completed',
    shipping1: 'completed',
    rates1: 'completed',
    failure1: 'failed',
    label1: 'not-run',
    confirmation1: 'not-run',
  },
  edgeStates: {
    'cart-authorize': 'observed',
    'authorize-capture': 'observed',
    'capture-shipping': 'observed',
    'shipping-rates': 'observed',
    'rates-no': 'observed',
    'rates-yes': 'not-taken',
    'label-confirmation': 'not-taken',
  },
} satisfies FlowDiagramObservation;

/** The host supplies this exact emphasis; no structural cause search is run. */
export const exampleProblemHighlight = {
  nodeIds: ['shipping1', 'rates1', 'failure1'],
  edgeIds: ['shipping-rates', 'rates-no'],
} satisfies FlowDiagramHighlight;

export const exampleProblem = {
  selectedNodeId: 'failure1',
  explanation: 'The recorded rates result was empty, so the No branch was taken.',
  facts: ['Shipping rates returned an empty list.', 'Rates found? recorded No.', 'No shipping option recorded a failed state.'],
} as const;

export const stateLabels: Record<FlowDiagramNodeState, string> = {
  unknown: 'Unknown',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  'not-run': 'Not run',
};

/** Human-readable descriptions of this fixture's admitted facts. */
export const exampleNodeDetails: Record<string, string> = {
  cart1: 'The recording marks the Cart step complete.',
  payment1: 'The recording marks this group and both of its steps complete. These states describe execution in this synthetic example.',
  authorize1: 'The recording marks the Authorize step complete. This is an example execution state.',
  capture1: 'The recording marks the Capture step complete. This is an example execution state.',
  shipping1: 'The recorded rates result was an empty list.',
  rates1: 'The recorded decision was No. The recording marks the No branch observed and the Yes branch not taken.',
  failure1: 'The recording marks No shipping option failed after the No branch was taken.',
  label1: 'The recording explicitly marks Label as not run.',
  confirmation1: 'The recording explicitly marks Confirmation as not run.',
};
