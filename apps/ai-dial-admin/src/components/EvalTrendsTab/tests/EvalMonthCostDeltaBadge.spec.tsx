import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import EvalMonthCostDeltaBadge from '@/src/components/EvalTrendsTab/EvalMonthCostDeltaBadge';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

// The shared `t()` mock drops its params; this one keeps them so the delta in the label can be asserted.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key),
  useCurrentLocale: () => 'en',
}));

const labelOf = (delta: string) => `${TestSuitesI18nKey.EvalTrendsDeltaVsPrevPeriod}:${JSON.stringify({ delta })}`;

const isGreen = (element: HTMLElement) => element.className.includes('bg-green');
const isRed = (element: HTMLElement) => element.className.includes('bg-red');

describe('EvalMonthCostDeltaBadge', () => {
  test('shows the delta label', () => {
    render(<EvalMonthCostDeltaBadge deltaLabel="+$214" />);

    expect(screen.getByText(labelOf('+$214'))).toBeTruthy();
  });

  test('paints a rise red and a fall green by default, as for cost', () => {
    const { rerender } = render(<EvalMonthCostDeltaBadge deltaLabel="+$214" />);
    expect(isRed(screen.getByText(labelOf('+$214')).closest('.dial-kit-badge') as HTMLElement)).toBe(true);

    rerender(<EvalMonthCostDeltaBadge deltaLabel="-$214" />);
    expect(isGreen(screen.getByText(labelOf('-$214')).closest('.dial-kit-badge') as HTMLElement)).toBe(true);
  });

  test('paints a rise green and a fall red when an increase is good', () => {
    const { rerender } = render(<EvalMonthCostDeltaBadge deltaLabel="+83" isIncreaseGood />);
    expect(isGreen(screen.getByText(labelOf('+83')).closest('.dial-kit-badge') as HTMLElement)).toBe(true);

    rerender(<EvalMonthCostDeltaBadge deltaLabel="-12" isIncreaseGood />);
    expect(isRed(screen.getByText(labelOf('-12')).closest('.dial-kit-badge') as HTMLElement)).toBe(true);
  });
});
