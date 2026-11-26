import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CoverageCard from '@/src/components/EvalSystemHealth/CoverageCard';
import { CoverageCardModel, CoverageKind, CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

// The shared `t()` mock drops its params; this one keeps them so the caption's numbers can be asserted.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key),
  useCurrentLocale: () => 'en',
}));

const cardOf = (overrides: Partial<CoverageCardModel> = {}): CoverageCardModel => ({
  kind: CoverageKind.Models,
  status: CoverageStatus.Ready,
  total: 118,
  covered: 112,
  uncovered: 6,
  rate: 112 / 118,
  ...overrides,
});

describe('CoverageCard', () => {
  test('shows the title, the percentage and the caption of a ready card', () => {
    render(<CoverageCard card={cardOf()} />);

    expect(screen.getByRole('region', { name: EvalSystemHealthI18nKey.TotalModels })).toBeInTheDocument();
    expect(screen.getByText('94.9%')).toBeInTheDocument();
    expect(
      screen.getByText(`${EvalSystemHealthI18nKey.CoverageCaption}:${JSON.stringify({ total: 118, uncovered: 6 })}`),
    ).toBeInTheDocument();
  });

  test('exposes the percentage and the card title through the progress bar', () => {
    render(<CoverageCard card={cardOf()} />);

    const bar = screen.getByRole('progressbar', { name: EvalSystemHealthI18nKey.TotalModels });
    expect(bar).toHaveAttribute('aria-valuetext', '94.9%');
    expect(Number(bar.getAttribute('aria-valuenow'))).toBeCloseTo(94.9, 1);
  });

  test('shows an empty-value indicator, no bar and a zero caption when nothing is deployed', () => {
    render(
      <CoverageCard card={cardOf({ kind: CoverageKind.Toolsets, total: 0, covered: 0, uncovered: 0, rate: null })} />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(
      screen.getByText(`${EvalSystemHealthI18nKey.CoverageCaption}:${JSON.stringify({ total: 0, uncovered: 0 })}`),
    ).toBeInTheDocument();
  });

  test('shows a progress bar with a 0% value for a deployed but fully uncovered kind', () => {
    render(<CoverageCard card={cardOf({ total: 3, covered: 0, uncovered: 3, rate: 0 })} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  test('shows a loading indicator and no percentage while loading', () => {
    render(
      <CoverageCard
        card={cardOf({ status: CoverageStatus.Loading, total: 0, covered: 0, uncovered: 0, rate: null })}
      />,
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('shows an error message with an alert role when loading failed', () => {
    render(
      <CoverageCard card={cardOf({ status: CoverageStatus.Error, total: 0, covered: 0, uncovered: 0, rate: null })} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(EvalSystemHealthI18nKey.CoverageLoadFailed);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('puts the info control on the Total Evaluatees card only', () => {
    const { rerender } = render(<CoverageCard card={cardOf({ kind: CoverageKind.Evaluatees })} />);
    expect(screen.getByRole('button', { name: EvalSystemHealthI18nKey.CoverageInfoLabel })).toBeInTheDocument();

    rerender(<CoverageCard card={cardOf({ kind: CoverageKind.Applications })} />);
    expect(screen.queryByRole('button', { name: EvalSystemHealthI18nKey.CoverageInfoLabel })).not.toBeInTheDocument();
  });

  test('explains the coverage rule in a tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<CoverageCard card={cardOf({ kind: CoverageKind.Evaluatees })} />);

    await user.hover(screen.getByRole('button', { name: EvalSystemHealthI18nKey.CoverageInfoLabel }));

    expect(
      await screen.findByText(`${EvalSystemHealthI18nKey.CoverageInfoTooltip}:${JSON.stringify({ days: 30 })}`),
    ).toBeInTheDocument();
  });

  test('explains the coverage rule in a tooltip on keyboard focus', async () => {
    const user = userEvent.setup();
    render(<CoverageCard card={cardOf({ kind: CoverageKind.Evaluatees })} />);

    await user.tab();

    expect(screen.getByRole('button', { name: EvalSystemHealthI18nKey.CoverageInfoLabel })).toHaveFocus();
    expect(
      await screen.findByText(`${EvalSystemHealthI18nKey.CoverageInfoTooltip}:${JSON.stringify({ days: 30 })}`),
    ).toBeInTheDocument();
  });
});
