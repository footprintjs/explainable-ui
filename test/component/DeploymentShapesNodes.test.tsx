/** @vitest-environment jsdom */
import { createElement } from 'react';
import { render } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import type { StageNodeData } from 'footprint-explainable-ui/flowchart';
import { describe, expect, it, vi } from 'vitest';
import { getDeviceGeometry } from '../../examples/deployment-shapes/deviceGeometry';
import { InfrastructureStageNode, infrastructureNodeTypes } from '../../examples/deployment-shapes/InfrastructureStageNode';

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('@xyflow/react', async importOriginal => ({ ...await importOriginal<typeof import('@xyflow/react')>(), useUpdateNodeInternals: () => update }));

function node(data: Partial<StageNodeData>) {
  return createElement(ReactFlowProvider, null, createElement(InfrastructureStageNode, {
    id: 'deploy-server', data: { label: 'Deploy server', infrastructureKind: 'server', ...data },
    type: 'stageNode', zIndex: 0, draggable: false, selected: false, dragging: false,
    selectable: true, deletable: false, isConnectable: false, positionAbsoluteX: 0, positionAbsoluteY: 0,
  } satisfies Parameters<typeof InfrastructureStageNode>[0]));
}

describe('consumer deployment device shapes', () => {
  it.each(['server', 'router', 'switch', 'unknown-role'] as const)('owns bounded geometry and four matching edge anchors for %s', kind => {
    const geometry = getDeviceGeometry(kind), view = render(node({ infrastructureKind: kind }));
    expect(geometry.width).toBe(224);
    for (const rectangle of [geometry.paint, geometry.body, geometry.content, geometry.footer]) {
      expect(rectangle.x).toBeGreaterThanOrEqual(0); expect(rectangle.y).toBeGreaterThanOrEqual(0);
      expect(rectangle.x + rectangle.width).toBeLessThanOrEqual(geometry.width);
      expect(rectangle.y + rectangle.height).toBeLessThanOrEqual(geometry.height);
    }
    const element = view.container.querySelector<HTMLElement>('[data-fp="infrastructure-stage-node"]')!;
    expect(element.style.width).toBe(`${geometry.width}px`); expect(element.style.height).toBe(`${geometry.height}px`);
    expect(view.getByRole('img', { name: `${geometry.kind} shape` })).toBeTruthy();
    const handles = [...view.container.querySelectorAll<HTMLElement>('.react-flow__handle')];
    expect(handles).toHaveLength(4);
    for (const [index, [name, port]] of Object.entries(geometry.ports).entries()) {
      expect(handles[index].style.left).toBe(`${port.x}px`); expect(handles[index].style.top).toBe(`${port.y}px`);
      expect(handles[index].dataset.handlepos).toBe(port.side);
      if (name.startsWith('loop-')) expect(handles[index].dataset.handleid).toBe(name);
    }
  });

  it('uses different device outlines and falls back without classifying by stage label', () => {
    const view = render(node({ infrastructureKind: 'router' }));
    expect(view.container.querySelector('[data-device-detail="router-disk"] ellipse')).toBeTruthy();
    view.rerender(node({ infrastructureKind: 'switch' }));
    expect(view.container.querySelectorAll('[data-device-detail="switch-ports"] rect')).toHaveLength(9);
    view.rerender(node({ label: 'Router server switch', infrastructureKind: undefined }));
    expect(view.container.querySelector('[data-device-detail="fallback-card"]')).toBeTruthy();
  });

  it('keeps recorded execution and trace membership independent without adding health or actions', () => {
    const data: Partial<StageNodeData> = { active: true, done: true, error: true, dimmed: true, stepNumbers: [1, 4], showStageId: true, stageId: 'deploy-server',
      description: 'Recorded deployment attempt', traceWorkflow: { role: 'question', color: 'purple', values: [{ key: 'deployment\u001ftotal', preview: '35', color: 'purple' }] } };
    const before = structuredClone(data), view = render(node(data));
    const element = view.container.querySelector<HTMLElement>('[data-fp="infrastructure-stage-node"]')!;
    expect(element.dataset.active).toBe('true'); expect(element.dataset.done).toBe('true'); expect(element.dataset.error).toBe('true');
    expect(element.dataset.traceRole).toBe('question'); expect(element.dataset.traceContext).toBe('displayed'); expect(element.style.opacity).toBe('1');
    expect(view.getByText('VIEWING')).toBeTruthy(); expect(view.getByTitle('Recorded steps 1, 4')).toBeTruthy();
    expect(view.getByText('Question · deployment.total = 35')).toBeTruthy();
    expect(view.getByText('Recorded deployment attempt')).toBeTruthy(); expect(view.getByTitle('stageId: deploy-server')).toBeTruthy();
    expect(view.container.textContent).not.toMatch(/healthy|success|online/i);
    expect(view.container.querySelectorAll('button,[tabindex]')).toHaveLength(0);
    expect(data).toEqual(before);
  });

  it('preserves explicit outside context, and changes ports only when device geometry changes', () => {
    update.mockClear(); const view = render(node({ active: true, traceContext: 'outside' }));
    expect(view.getByText('VIEWING')).toBeTruthy(); expect(view.getByText('Outside displayed trace')).toBeTruthy();
    expect(update).toHaveBeenCalledWith('deploy-server'); update.mockClear();
    view.rerender(node({ infrastructureKind: 'server', active: false, done: true }));
    expect(update).not.toHaveBeenCalled();
    view.rerender(node({ infrastructureKind: 'router', active: false, done: true }));
    expect(update).toHaveBeenCalledOnce();
    expect(Object.isFrozen(infrastructureNodeTypes)).toBe(true);
    expect(Object.keys(infrastructureNodeTypes)).toEqual(['stageNode']);
  });
});
