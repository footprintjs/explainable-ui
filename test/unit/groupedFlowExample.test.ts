// @vitest-environment jsdom
import { createElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GroupedFlowExample } from '../../examples/grouped-flow/demo';
import {
  exampleDefinition,
  exampleObservation,
  exampleProblemHighlight,
} from '../../examples/grouped-flow/fixture';

// Keep these host-integration tests independent of canvas measurements.
vi.mock('../../src/components/GroupedFlowDiagram/GroupedFlowDiagram', async () => {
  const { createElement: element } = await import('react');
  return {
    GroupedFlowDiagram: (props: {
      selectedNodeId?: string;
      direction: 'LR' | 'TB';
      expandedGroupIds: readonly string[];
      highlight?: { nodeIds?: readonly string[]; edgeIds?: readonly string[] };
      onSelectNode: (id: string) => void;
      onExpandedGroupIdsChange: (ids: readonly string[]) => void;
    }) => element('div', {
      'data-testid': 'example-diagram',
      'data-selected': props.selectedNodeId,
      'data-direction': props.direction,
      'data-expanded': props.expandedGroupIds.join(','),
      'data-highlight-nodes': props.highlight?.nodeIds?.join(',') ?? '',
      'data-highlight-edges': props.highlight?.edgeIds?.join(',') ?? '',
    },
    element('button', { onClick: () => props.onSelectNode('label1') }, 'Select label in diagram'),
    element('button', { onClick: () => props.onExpandedGroupIdsChange(['payment1']) }, 'Open group in diagram')),
  };
});

describe('grouped flow offline example', () => {
  it('keeps the expansion control and supplied selection in sync with the diagram', () => {
    render(createElement(GroupedFlowExample));
    const diagram = screen.getByTestId('example-diagram');
    expect(screen.getByText('Example recording')).toBeTruthy();
    expect(diagram.getAttribute('data-direction')).toBe('LR');
    expect(diagram.getAttribute('data-expanded')).toBe('payment1');
    fireEvent.click(screen.getByRole('button', { name: /Collapse payment/ }));
    expect(diagram.getAttribute('data-expanded')).toBe('');
    expect(screen.getByRole('button', { name: /Expand payment/ }).getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Open group in diagram' }));
    expect(screen.getByRole('button', { name: /Collapse payment/ }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Select label in diagram' }));
    expect(diagram.getAttribute('data-selected')).toBe('label1');
    expect(screen.getByText('The recording explicitly marks Label as not run.')).toBeTruthy();
  });

  it('switches to a vertical mobile flow and unsubscribes when unmounted', () => {
    const originalMatchMedia = window.matchMedia;
    let mobile = true;
    const listeners = new Set<() => void>();
    const mediaQuery = {
      get matches() { return mobile; },
      addEventListener: vi.fn((_event: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_event: string, listener: () => void) => listeners.delete(listener)),
    };
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => mediaQuery),
    });
    try {
      const view = render(createElement(GroupedFlowExample));
      expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 640px)');
      expect(screen.getByTestId('example-diagram').getAttribute('data-direction')).toBe('TB');
      act(() => {
        mobile = false;
        listeners.forEach((listener) => listener());
      });
      expect(screen.getByTestId('example-diagram').getAttribute('data-direction')).toBe('LR');
      view.unmount();
      expect(mediaQuery.removeEventListener).toHaveBeenCalledOnce();
      expect(listeners.size).toBe(0);
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
    }
  });

  it('uses only the fixture-approved emphasis and fact when the problem is traced', () => {
    render(createElement(GroupedFlowExample));
    const diagram = screen.getByTestId('example-diagram');
    expect(diagram.getAttribute('data-highlight-nodes')).toBe('');
    fireEvent.click(screen.getByRole('button', { name: /Trace this problem/ }));
    expect(diagram.getAttribute('data-selected')).toBe('failure1');
    expect(diagram.getAttribute('data-highlight-nodes')).toBe(exampleProblemHighlight.nodeIds.join(','));
    expect(diagram.getAttribute('data-highlight-edges')).toBe(exampleProblemHighlight.edgeIds.join(','));
    expect(screen.getByText('The recorded rates result was empty, so the No branch was taken.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear trace' }));
    expect(diagram.getAttribute('data-highlight-nodes')).toBe('');
  });

  it('supplies explicit observations for the untaken branch without changing the structural flow', () => {
    expect(exampleDefinition.edges.some((edge) => edge.source === 'rates1' && edge.target === 'label1')).toBe(true);
    expect(exampleObservation.nodeStates.label1).toBe('not-run');
    expect(exampleObservation.nodeStates.confirmation1).toBe('not-run');
    expect(exampleObservation.edgeStates['rates-no']).toBe('observed');
    expect(exampleObservation.edgeStates['rates-yes']).toBe('not-taken');
    expect(exampleProblemHighlight.nodeIds).not.toContain('payment1');
  });
});
