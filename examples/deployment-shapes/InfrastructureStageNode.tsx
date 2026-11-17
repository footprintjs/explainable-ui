import { memo, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { StageNodeData } from 'footprint-explainable-ui/flowchart';
import { getDeviceGeometry } from './deviceGeometry';
import { DeviceDrawing } from './device-drawing';

const position = { top: Position.Top, bottom: Position.Bottom, left: Position.Left, right: Position.Right };
const box = { position: 'absolute', boxSizing: 'border-box' } as const;
const clipped: CSSProperties = { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' };
const roleLabel = { question: 'Question', input: 'Recorded input', upstream: 'Upstream read' };

/** A consumer nodeTypes.stageNode override. Stage IDs, execution flags and trace data stay intact. */
export const InfrastructureStageNode = memo(function InfrastructureStageNode({ id, data, isConnectable }: NodeProps & { data: StageNodeData }) {
  const geometry = getDeviceGeometry(data.infrastructureKind);
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => { updateNodeInternals(id); }, [id, geometry.revision, updateNodeInternals]);
  const trace = data.traceWorkflow;
  const traceContext = data.traceContext ?? (trace ? 'displayed' : undefined);
  const tracing = traceContext !== undefined;
  const color = data.unstyled ? 'currentColor' : data.active ? 'var(--fp-node-cursor, #b7791f)'
    : data.error ? 'var(--fp-color-error, #c0392b)' : data.done ? 'var(--fp-node-visited, #32734a)' : 'var(--fp-border, #777)';
  const text = data.unstyled ? 'currentColor' : 'var(--fp-text-primary, #252923)';
  const badge = (background: string): CSSProperties => ({ ...box, ...clipped, top: 6, height: 18,
    borderRadius: 'var(--fp-radius-control, 5px)', padding: '1px 5px', lineHeight: '16px', fontSize: 10,
    background: data.unstyled ? undefined : background, color: data.unstyled ? undefined : 'var(--fp-on-node-visited, #fff)' });
  const status = [data.active && (tracing ? 'viewing recorded step' : 'current recorded step'), data.done && 'visited', data.error && 'recorded execution error'].filter(Boolean).join(', ');
  const traceTitle = trace ? `${roleLabel[trace.role]}${trace.values.length ? ` · ${trace.values.map(value => `${value.key.split('\u001f').join('.')} ${value.preview === null ? '· preview unavailable' : `= ${value.preview}`}`).join('; ')}` : ''}` : undefined;
  const content = geometry.content;
  return <div data-fp="infrastructure-stage-node" data-device-kind={geometry.kind}
    data-active={data.active || undefined} data-done={data.done || undefined} data-error={data.error || undefined}
    data-trace-role={trace?.role} data-trace-context={traceContext} data-motion-suppressed={data.suppressMotion || undefined}
    data-unstyled={data.unstyled || undefined} role="group" aria-label={`${data.label}; ${geometry.kind} shape${status ? `; ${status}` : ''}`}
    title={traceContext === 'outside' ? 'Outside displayed trace. Recorded execution status is shown independently.'
      : traceContext === 'displayed' ? 'In displayed trace. Recorded execution status is shown independently.' : undefined}
    style={{ position: 'relative', width: geometry.width, height: geometry.height, boxSizing: 'border-box',
      fontFamily: 'var(--fp-font-sans, system-ui, sans-serif)', color: text,
      opacity: !tracing && (data.dimmed || data.emphasis === 'muted') ? 0.48 : 1 }}>
    <div aria-hidden="true" data-device-highlight="execution" style={{ ...box, left: geometry.paint.x, top: geometry.paint.y,
      width: geometry.paint.width, height: geometry.paint.height, borderRadius: 'var(--fp-node-radius, 9px)',
      border: data.active || data.error || data.done || data.linked ? `var(--fp-node-border-width, 2px) ${data.isLazy && !data.active && !data.done ? 'dashed' : 'solid'} ${color}` : undefined,
      background: data.active && !data.unstyled ? 'color-mix(in srgb, var(--fp-node-cursor, #b7791f) 9%, transparent)' : undefined,
      pointerEvents: 'none' }} />
    {trace && <div aria-hidden="true" data-device-highlight="trace" style={{ ...box, inset: 1, borderRadius: 'var(--fp-node-radius, 9px)',
      border: `2px solid ${data.unstyled ? 'currentColor' : trace.color}`, pointerEvents: 'none' }} />}
    {data.stepNumbers?.length && (data.active || data.done) ? <span data-device-badge="steps"
      title={`Recorded steps ${data.stepNumbers.join(', ')}`} style={{ ...badge('var(--fp-node-visited, #32734a)'), left: 8, maxWidth: 104 }}>
      {data.stepNumbers.join(', ')}
    </span> : null}
    {data.active && <span data-device-badge="cursor" style={{ ...badge('var(--fp-node-cursor, #b7791f)'), right: 8,
      maxWidth: 92, color: data.unstyled ? undefined : 'var(--fp-on-node-cursor, #252923)' }}>{tracing ? 'VIEWING' : 'NOW'}</span>}
    <div style={{ ...box, left: geometry.body.x, top: geometry.body.y, width: geometry.body.width, height: geometry.body.height,
      color: data.unstyled ? 'currentColor' : 'var(--fp-node-border-color, var(--fp-text-primary, #252923))' }}>
      <DeviceDrawing kind={geometry.kind} unstyled={data.unstyled} />
    </div>
    <div style={{ ...box, left: content.x, top: content.y, width: content.width, height: content.height, textAlign: 'center' }}>
      <div title={data.label} style={{ ...clipped, fontSize: 13, lineHeight: '18px', fontWeight: 650 }}>{data.label}</div>
      <div title={data.description} style={{ ...clipped, height: 14, fontSize: 10, lineHeight: '14px', color: 'var(--fp-text-secondary, #666)' }}>{data.description}</div>
      {data.showStageId && data.stageId && <div title={`stageId: ${data.stageId}`} style={{ ...clipped, height: 12, fontFamily: 'var(--fp-font-mono, ui-monospace, monospace)', fontSize: 9, lineHeight: '12px' }}>{data.stageId}</div>}
    </div>
    {(trace || traceContext === 'outside' || data.error) && <div data-device-badge="evidence" title={traceTitle}
      style={{ ...box, ...clipped, left: geometry.footer.x, top: geometry.footer.y, width: geometry.footer.width, height: geometry.footer.height,
        fontSize: 10, lineHeight: '16px', padding: '0 4px', textAlign: 'center', border: `1px solid ${data.unstyled ? 'currentColor' : trace?.color ?? color}`,
        borderRadius: 'var(--fp-radius-control, 5px)', color: data.unstyled ? undefined : trace?.color ?? text }}>
      {traceTitle ?? (traceContext === 'outside' ? 'Outside displayed trace' : 'Recorded execution error')}
    </div>}
    {Object.entries(geometry.ports).map(([name, port]) => <Handle key={name}
      id={name.startsWith('loop-') ? name : undefined} type={name === 'target' || name === 'loop-target' ? 'target' : 'source'}
      position={position[port.side]} isConnectable={isConnectable}
      style={{ left: port.x, top: port.y, right: 'auto', bottom: 'auto', width: 6, height: 6,
        transform: 'translate(-50%, -50%)', opacity: 0 }} />)}
  </div>;
});

/** Object identity stays stable while live overlays update node.data. */
export const infrastructureNodeTypes = Object.freeze({ stageNode: InfrastructureStageNode });
