import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import HealthDistributionLegend from '@/src/components/EvalSystemHealth/HealthDistributionLegend';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

// The shared `t()` mock drops its params; this one keeps them so the threshold and week count can be asserted.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key),
  useCurrentLocale: () => 'en',
}));

const threshold = (value: number) => JSON.stringify({ threshold: value });

describe('HealthDistributionLegend', () => {
  test('names the healthy and fail bands with the threshold, healthy first', () => {
    render(<HealthDistributionLegend threshold={0.75} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(`${EvalSystemHealthI18nKey.HealthDistributionLegendHealthy}:${threshold(0.75)}`);
    expect(items[1]).toHaveTextContent(`${EvalSystemHealthI18nKey.HealthDistributionLegendFail}:${threshold(0.75)}`);
  });

  test('uses the threshold it is given', () => {
    render(<HealthDistributionLegend threshold={0.6} />);

    expect(
      screen.getByText(`${EvalSystemHealthI18nKey.HealthDistributionLegendHealthy}:${threshold(0.6)}`),
    ).toBeTruthy();
  });

  test('is plain text, not a set of controls', () => {
    render(<HealthDistributionLegend threshold={0.75} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
