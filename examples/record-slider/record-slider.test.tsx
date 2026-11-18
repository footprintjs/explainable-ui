// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

function choose(name: string, value: string) {
  fireEvent.change(screen.getByRole('combobox', { name }), { target: { value } });
}

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole('button', { name }));
}

describe('Foottrace record slider consumer', () => {
  it('keeps the selected stop across scales and both slider styles', () => {
    render(<App />);
    click('PickBase');
    for (const presentation of ['range', 'segmented']) {
      choose('Slider style', presentation);
      const positions = ['steps', 'duration', 'log-duration'].map(scale => {
        choose('Slider spacing', scale);
        const slider = screen.getByRole<HTMLInputElement>('slider', { name: 'Recorded stop' });
        expect(slider.getAttribute('aria-valuetext')).toContain('PickBase');
        expect(screen.getByRole('button', { name: 'PickBase' }).getAttribute('aria-current')).toBe('step');
        return slider.value;
      });
      expect(new Set(positions).size).toBe(3);
    }
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Audit' }).getAttribute('aria-current')).toBe('step');
    click('Quote');
    click('Explain quote');
    const prose = screen.getByText(/SLICE for 'quote'/).textContent;
    expect(prose).toContain('pick-base#1');
    expect(prose).toContain('assess-risk#3');
  });

  it('follows both nested writers of 35 and returns the shared cursor and focus to the question', () => {
    render(<App />);
    choose('Recording', 'combined');
    click('Combine');
    click('Explain total');

    for (const [stage, amount] of [['Items', 30], ['Delivery', 5]] as const) {
      const link = `Follow ${stage} · runs › ${stage.toLowerCase()} › amount = ${amount}`;
      click(link);
      expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toContain(stage);
      expect(screen.getByRole('button', { name: stage }).getAttribute('aria-current')).toBe('step');
      click('Return to recorded question');
      expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toContain('Combine');
      expect(screen.getByText(/SLICE for 'total'/).textContent).toContain('combine#4');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: link }));
    }
  });

  it('reads Go, HCI and Viz through one cursor and clears the old question on source change', () => {
    render(<App />);
    choose('Recording', 'go');
    click('Invoice');
    click('Explain invoiceTotal');
    expect(screen.getByText(/SLICE for 'invoiceTotal'/).textContent).toContain('subtotal#0');

    choose('Recording', 'storefront');
    expect(screen.queryByText(/SLICE for 'invoiceTotal'/)).toBeNull();
    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toContain('Run start');
    click(/checkout#3.*committed/);
    click('Explain orderId');
    expect(screen.getByText(/SLICE for 'orderId'/).textContent).toContain('add#2');
    expect(screen.queryByRole('button', { name: /add#4/ })).toBeNull();

    choose('Recording', 'viz');
    click('assign quantile bins');
    expect(screen.getByRole('list', { name: 'Recorded amounts and cluster assignments' }).textContent).toContain('Cluster 1');
    click('Explain cluster_id');
    expect(screen.getByText(/SLICE for 'cluster_id'/).textContent).toContain('load#0');
    click('load values');
    expect(screen.queryByText('Cluster 1')).toBeNull();
    expect(screen.getAllByText('Unassigned')).toHaveLength(4);
  });
});
