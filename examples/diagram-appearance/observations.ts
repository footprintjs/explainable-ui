import {
  createDiagramAppearanceReader, graphFromStructure,
  type DiagramAppearanceChange, type DiagramGeometry, type TraceFlowLayout,
} from 'footprint-explainable-ui/flowchart';

// The plan exists before the app receives any observations.
export const graph = graphFromStructure({ id: 'compose', name: 'Compose', next: { id: 'review', name: 'Review' } });
export const reviewId = 'review';
export const handoffId = graph.edges[0]!.id;

const sheet = {
  width: 184, height: 96, target: { x: 51, y: 8 }, source: { x: 133, y: 88 }, drawing: 'sheet',
};
export const geometry: DiagramGeometry = { nodes: { compose: sheet, review: sheet } };

// Leave room for the relationship caption and the independent status on Review.
function positionReview(x: number, y: number): TraceFlowLayout {
  return plan => ({ ...plan, nodes: plan.nodes.map(node =>
    node.id === reviewId ? { ...node, position: { x, y } } : node) });
}
export const layouts = { flat: positionReview(0, 245), isometric: positionReview(345, 198) };

export const stepNames = [
  'Plan', 'Creation requested', 'Counts reported', 'Health reported', 'Removal requested', 'Removal confirmed',
] as const;

// Illustrative observations supplied by this app. Each entry replaces one object's facts.
const changes: DiagramAppearanceChange[] = [
  { step: 1, target: 'node', id: reviewId, appearance: { activity: 'creating', presence: 'present' } },
  { step: 1, target: 'edge', id: handoffId, appearance: { activity: 'creating', presence: 'present' } },
  { step: 2, target: 'node', id: reviewId, appearance: { activity: 'updating', progress: { completed: 3, total: 8, unit: 'pages' } } },
  { step: 2, target: 'edge', id: handoffId, appearance: { activity: 'updating', progress: { completed: 1, total: 4, unit: 'files' } } },
  { step: 3, target: 'node', id: reviewId, appearance: { activity: 'updating', progress: { completed: 3, total: 8, unit: 'pages' }, health: 'Needs attention' } },
  { step: 4, target: 'node', id: reviewId, appearance: { activity: 'removing', presence: 'present' } },
  { step: 4, target: 'edge', id: handoffId, appearance: { activity: 'removing', presence: 'present' } },
  { step: 5, target: 'node', id: reviewId, appearance: { presence: 'removed' } },
  { step: 5, target: 'edge', id: handoffId, appearance: { presence: 'removed' } },
];
export const reader = createDiagramAppearanceReader(changes);
