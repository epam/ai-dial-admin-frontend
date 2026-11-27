import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ActivityCard from '@/src/components/EvalSystemHealth/ActivityCard';
import { ActivityCardModel, ActivityKind, CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { EvalSystemHealthI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

// The shared `t()` mock drops its params; this one keeps them so counts and captions can be asserted.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key),
  useCurrentLocale: () => 'en',
}));

const WINDOWS = {
  current: { fromMs: 0, toMs: 0, label: '01 - 18 Nov, 2026' },
  previous: { fromMs: 0, toMs: 0, label: '01 - 18 Oct, 2026' },
};

const runCard = (overrides: Partial<ActivityCardModel> = {}): ActivityCardModel => ({
  kind: ActivityKind.SuitesRun,
  status: CoverageStatus.Ready,
  value: 1284,
  delta: 83,
  total: 1847,
  rate: 1284 / 1847,
  evaluateeCount: null,
  ...overrides,
});

const addedCard = (overrides: Partial<ActivityCardModel> = {}): ActivityCardModel => ({
  kind: ActivityKind.SuitesAdded,
  status: CoverageStatus.Ready,
  value: 47,
  delta: 9,
  total: null,
  rate: null,
  evaluateeCount: 31,
  ...overrides,
});

const renderCard = (card: ActivityCardModel) => render(<ActivityCard card={card} windows={WINDOWS} />);

describe('ActivityCard — test suites run', () => {
  test('shows the title, the grouped count and the total with the percentage', () => {
    renderCard(runCard());

    expect(screen.getByRole('region', { name: EvalSystemHealthI18nKey.SuitesRunThisMonth })).toBeTruthy();
    expect(screen.getByText('1,284')).toBeTruthy();
    expect(
      screen.getByText(
        `${EvalSystemHealthI18nKey.SuitesRunCaption}:${JSON.stringify({ total: '1,847', percent: '69.5%' })}`,
      ),
    ).toBeTruthy();
  });

  test('shows the delta against the previous period', () => {
    renderCard(runCard());

    expect(
      screen.getByText(`${TestSuitesI18nKey.EvalTrendsDeltaVsPrevPeriod}:${JSON.stringify({ delta: '+83' })}`),
    ).toBeTruthy();
  });

  test('names the two periods for assistive technology', () => {
    renderCard(runCard());

    expect(
      screen.getByText(
        `${EvalSystemHealthI18nKey.ActivityPeriods}:${JSON.stringify({ current: '01 - 18 Nov, 2026', previous: '01 - 18 Oct, 2026' })}`,
      ),
    ).toBeTruthy();
  });

  test('shows no delta badge when the count did not change', () => {
    renderCard(runCard({ delta: 0 }));

    expect(screen.queryByText(/EvalTrendsDeltaVsPrevPeriod/)).toBeNull();
  });

  test('shows a dash instead of a percentage when no test suite exists', () => {
    renderCard(runCard({ value: 0, delta: 0, total: 0, rate: null }));

    expect(
      screen.getByText(`${EvalSystemHealthI18nKey.SuitesRunCaption}:${JSON.stringify({ total: '0', percent: '—' })}`),
    ).toBeTruthy();
  });
});

describe('ActivityCard — test suites added', () => {
  test('shows the title, the count and how many evaluatees they span', () => {
    renderCard(addedCard());

    expect(screen.getByRole('region', { name: EvalSystemHealthI18nKey.SuitesAddedThisMonth })).toBeTruthy();
    expect(screen.getByText('47')).toBeTruthy();
    expect(
      screen.getByText(`${EvalSystemHealthI18nKey.SuitesAddedCaption}:${JSON.stringify({ count: 31 })}`),
    ).toBeTruthy();
  });

  test('shows a fall against the previous period', () => {
    renderCard(addedCard({ delta: -5 }));

    expect(
      screen.getByText(`${TestSuitesI18nKey.EvalTrendsDeltaVsPrevPeriod}:${JSON.stringify({ delta: '-5' })}`),
    ).toBeTruthy();
  });
});

describe('ActivityCard — states', () => {
  test('shows a loading indicator and no count while loading', () => {
    renderCard(runCard({ status: CoverageStatus.Loading, value: 0, delta: null, total: null, rate: null }));

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('shows an error message with an alert role when loading failed', () => {
    renderCard(addedCard({ status: CoverageStatus.Error, value: 0, delta: null, evaluateeCount: null }));

    expect(screen.getByRole('alert').textContent).toContain(EvalSystemHealthI18nKey.ActivityLoadFailed);
    expect(screen.queryByText('0')).toBeNull();
  });
});
