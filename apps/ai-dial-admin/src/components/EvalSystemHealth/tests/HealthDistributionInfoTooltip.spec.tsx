import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HealthDistributionInfoTooltip from '@/src/components/EvalSystemHealth/HealthDistributionInfoTooltip';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

// The shared `t()` mock drops its params; this one keeps them so the threshold and week count can be asserted.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key),
  useCurrentLocale: () => 'en',
}));

const TOOLTIP_TEXT = `${EvalSystemHealthI18nKey.HealthDistributionInfoTooltip}:${JSON.stringify({ threshold: 0.75 })}`;

describe('HealthDistributionInfoTooltip', () => {
  test('gives the info control an accessible name', () => {
    render(<HealthDistributionInfoTooltip threshold={0.75} />);

    expect(screen.getByRole('button', { name: EvalSystemHealthI18nKey.HealthDistributionInfoLabel })).toBeTruthy();
  });

  test('explains the chart with the threshold in a tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<HealthDistributionInfoTooltip threshold={0.75} />);

    await user.hover(screen.getByRole('button', { name: EvalSystemHealthI18nKey.HealthDistributionInfoLabel }));

    expect(await screen.findByText(TOOLTIP_TEXT)).toBeTruthy();
  });

  test('shows the same tooltip on keyboard focus', async () => {
    const user = userEvent.setup();
    render(<HealthDistributionInfoTooltip threshold={0.75} />);

    await user.tab();

    expect(screen.getByRole('button', { name: EvalSystemHealthI18nKey.HealthDistributionInfoLabel })).toHaveFocus();
    expect(await screen.findByText(TOOLTIP_TEXT)).toBeTruthy();
  });
});
