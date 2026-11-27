import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import EvalCostCard from '@/src/components/EvalSystemHealth/EvalCostCard';
import { CoverageStatus, EvalCostCardModel } from '@/src/components/EvalSystemHealth/models';
import { EvalSystemHealthI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

// The shared `t()` mock drops its params; this one keeps them so amounts and labels can be asserted.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key),
  useCurrentLocale: () => 'en',
}));

const WINDOWS = {
  current: { fromMs: 0, toMs: 0, label: '01 - 18 Nov, 2026' },
  previous: { fromMs: 0, toMs: 0, label: '01 - 18 Oct, 2026' },
};

const readyCard = (overrides: Partial<EvalCostCardModel> = {}): EvalCostCardModel => ({
  status: CoverageStatus.Ready,
  total: 4218,
  evaluateesCost: 2840,
  judgesCost: 1378,
  deltaLabel: '+$342',
  ...overrides,
});

const renderCard = (card: EvalCostCardModel) => render(<EvalCostCard card={card} windows={WINDOWS} />);

const splitOf = (evaluatees: string, judges: string) =>
  `${EvalSystemHealthI18nKey.EvalCostSplit}:${JSON.stringify({ evaluatees, judges })}`;
const badgeLabelOf = (delta: string) => `${TestSuitesI18nKey.EvalTrendsDeltaVsPrevPeriod}:${JSON.stringify({ delta })}`;
const badgeOf = (delta: string) => screen.getByText(badgeLabelOf(delta)).closest('.dial-kit-badge') as HTMLElement;

describe('EvalCostCard', () => {
  test('shows the title, the formatted total and the split', () => {
    renderCard(readyCard());

    expect(screen.getByRole('region', { name: EvalSystemHealthI18nKey.EvalCostThisMonth })).toBeTruthy();
    expect(screen.getByText('$4,218')).toBeTruthy();
    expect(screen.getByText(splitOf('$2,840', '$1,378'))).toBeTruthy();
  });

  test('keeps the cents of an amount that has them', () => {
    renderCard(readyCard({ total: 12.5, evaluateesCost: 10, judgesCost: 2.5, deltaLabel: null }));

    expect(screen.getByText('$12.50')).toBeTruthy();
    expect(screen.getByText(splitOf('$10', '$2.50'))).toBeTruthy();
  });

  test('shows a dash for a part the backend did not report and a zero for a part with no usage', () => {
    renderCard(readyCard({ evaluateesCost: null, judgesCost: 0 }));

    expect(screen.getByText(splitOf('—', '$0'))).toBeTruthy();
  });

  test('paints a rise red, since spending more is the worse outcome', () => {
    renderCard(readyCard({ deltaLabel: '+$342' }));

    expect(badgeOf('+$342').className).toContain('bg-red');
  });

  test('paints a fall green', () => {
    renderCard(readyCard({ deltaLabel: '-$214' }));

    expect(badgeOf('-$214').className).toContain('bg-green');
  });

  test('shows no badge without a delta label', () => {
    renderCard(readyCard({ deltaLabel: null }));

    expect(screen.queryByText(badgeLabelOf('+$342'))).toBeNull();
    expect(screen.getByText('$4,218')).toBeTruthy();
  });

  test('shows a dash and neither the split nor a badge when no cost was recorded', () => {
    renderCard(readyCard({ total: null, evaluateesCost: null, judgesCost: null, deltaLabel: null }));

    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText(/EvalCostSplit/)).toBeNull();
    expect(screen.queryByText(/EvalTrendsDeltaVsPrevPeriod/)).toBeNull();
  });

  test('names the two periods for assistive technology', () => {
    renderCard(readyCard());

    expect(
      screen.getByText(
        `${EvalSystemHealthI18nKey.ActivityPeriods}:${JSON.stringify({ current: '01 - 18 Nov, 2026', previous: '01 - 18 Oct, 2026' })}`,
      ),
    ).toBeTruthy();
  });
});

describe('EvalCostCard — states', () => {
  const emptyCard = { total: null, evaluateesCost: null, judgesCost: null, deltaLabel: null };

  test('shows a loading indicator and no total while loading', () => {
    renderCard({ ...emptyCard, status: CoverageStatus.Loading });

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText('—')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('shows an error message with an alert role when loading failed', () => {
    renderCard({ ...emptyCard, status: CoverageStatus.Error });

    expect(screen.getByRole('alert').textContent).toContain(EvalSystemHealthI18nKey.EvalCostLoadFailed);
    expect(screen.queryByText('—')).toBeNull();
  });
});
