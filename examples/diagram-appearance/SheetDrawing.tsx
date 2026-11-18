import type { DiagramDrawingProps, DiagramDrawings } from 'footprint-explainable-ui/flowchart';

// Both silhouettes meet the same local ports, including the sloping sides of the folded sheet.
function SheetDrawing({ renderer, geometry }: DiagramDrawingProps) {
  const raised = renderer === 'isometric';
  return <svg aria-hidden="true" width={geometry.width} height={geometry.height} viewBox="0 0 184 96"
    data-sheet-view={renderer} fill="none" stroke="var(--fp-border, #42665e)" strokeWidth="1.6" strokeLinejoin="round">
    {raised && <path fill="var(--fp-bg-secondary, #cdded8)" d="M8 36 51 8h29l96 37v9l-43 25L8 46Z" />}
    <path fill="var(--fp-bg-primary, #fffef9)" d={raised
      ? 'M8 36 51 8h29l96 37-43 27Z'
      : 'M12 8h138l22 22v42H12Z'} />
    <path d={raised ? 'M133 79v9' : 'M133 72v16'} />
    {raised
      ? <path d="m80 9 2 12 17-4" />
      : <path d="M150 8v22h22" />}
  </svg>;
}

export const drawings: DiagramDrawings = { sheet: SheetDrawing };
