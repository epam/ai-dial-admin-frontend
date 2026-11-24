import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';

import RunTrendBarsCell from '@/src/components/EvalSystemHealth/RunTrendBarsCell';
import { RunTrendRow } from '@/src/components/EvalSystemHealth/models';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

// The shared `t()` mock drops its params; this one keeps them so the text equivalent can be asserted.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key),
  useCurrentLocale: () => 'en',
}));

const renderCell = (points: number[]) =>
  render(<RunTrendBarsCell {...({ data: { points } as RunTrendRow } as ICellRendererParams<RunTrendRow>)} />);

const barsOf = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('[aria-hidden] > div'));

describe('RunTrendBarsCell', () => {
  test('draws one bar per run, oldest first', () => {
    const { container } = renderCell([0.2, 0.5, 0.9]);

    expect(barsOf(container).map((bar) => bar.style.height)).toEqual(['20%', '50%', '90%']);
  });

  test('colours each bar by the pass-rate band, green for high, yellow for medium and red for low', () => {
    const { container } = renderCell([0.9, 0.5, 0.2]);

    const [high, medium, low] = barsOf(container);
    expect(high.className).toContain('stroke-score-abs-10');
    expect(medium.className).toContain('stroke-score-abs-05');
    expect(low.className).toContain('stroke-score-abs-00');
  });

  test('keeps a bar for a pass rate of zero visible', () => {
    const { container } = renderCell([0]);

    expect(barsOf(container)[0].style.height).not.toBe('0%');
  });

  test('hides the bars from assistive technology and carries the rates as text instead', () => {
    const { container } = renderCell([0.5, 0.75, 1]);

    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(
      screen.getByText(
        `${EvalSystemHealthI18nKey.RunTrendsTrendSummary}:${JSON.stringify({ rates: '50%, 75%, 100%' })}`,
      ),
    ).toBeTruthy();
  });

  test('stays empty when there is no run to draw', () => {
    const { container } = renderCell([]);

    expect(container.firstChild).toBeNull();
  });
});
