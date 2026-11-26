import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ActivityCardRow from '@/src/components/EvalSystemHealth/ActivityCardRow';
import {
  ActivityCardModel,
  ActivityKind,
  CoverageStatus,
  EvalCostCardModel,
} from '@/src/components/EvalSystemHealth/models';
import { useActivityData } from '@/src/components/EvalSystemHealth/use-activity-data';
import { useEvalCostData } from '@/src/components/EvalSystemHealth/use-eval-cost-data';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/components/EvalSystemHealth/use-activity-data', () => ({ useActivityData: vi.fn() }));
vi.mock('@/src/components/EvalSystemHealth/use-eval-cost-data', () => ({ useEvalCostData: vi.fn() }));

const WINDOWS = {
  current: { fromMs: 0, toMs: 0, label: 'current' },
  previous: { fromMs: 0, toMs: 0, label: 'previous' },
};

const card = (kind: ActivityKind, overrides: Partial<ActivityCardModel> = {}): ActivityCardModel => ({
  kind,
  status: CoverageStatus.Ready,
  value: 10,
  delta: 1,
  total: 20,
  rate: 0.5,
  evaluateeCount: 3,
  ...overrides,
});

const costCard = (overrides: Partial<EvalCostCardModel> = {}): EvalCostCardModel => ({
  status: CoverageStatus.Ready,
  total: 4218,
  evaluateesCost: 2840,
  judgesCost: 1378,
  deltaLabel: null,
  ...overrides,
});

describe('ActivityCardRow', () => {
  test('draws its children before the activity cards', () => {
    vi.mocked(useActivityData).mockReturnValue({
      cards: [card(ActivityKind.SuitesRun), card(ActivityKind.SuitesAdded)],
      windows: WINDOWS,
    });
    vi.mocked(useEvalCostData).mockReturnValue(costCard());

    render(
      <ActivityCardRow>
        <section aria-label="leading card" />
      </ActivityCardRow>,
    );

    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual([
      'leading card',
      EvalSystemHealthI18nKey.SuitesRunThisMonth,
      EvalSystemHealthI18nKey.SuitesAddedThisMonth,
      EvalSystemHealthI18nKey.EvalCostThisMonth,
    ]);
  });

  test('renders the two count cards and the eval cost card in order', () => {
    vi.mocked(useActivityData).mockReturnValue({
      cards: [card(ActivityKind.SuitesRun), card(ActivityKind.SuitesAdded)],
      windows: WINDOWS,
    });
    vi.mocked(useEvalCostData).mockReturnValue(costCard());

    render(<ActivityCardRow />);

    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual([
      EvalSystemHealthI18nKey.SuitesRunThisMonth,
      EvalSystemHealthI18nKey.SuitesAddedThisMonth,
      EvalSystemHealthI18nKey.EvalCostThisMonth,
    ]);
  });

  test('loads the cost over the same windows as the count cards', () => {
    vi.mocked(useActivityData).mockReturnValue({ cards: [], windows: WINDOWS });
    vi.mocked(useEvalCostData).mockReturnValue(costCard());

    render(<ActivityCardRow />);

    expect(useEvalCostData).toHaveBeenCalledWith(WINDOWS);
  });

  test('keeps the other cards when one count card failed', () => {
    vi.mocked(useActivityData).mockReturnValue({
      cards: [card(ActivityKind.SuitesRun), card(ActivityKind.SuitesAdded, { status: CoverageStatus.Error })],
      windows: WINDOWS,
    });
    vi.mocked(useEvalCostData).mockReturnValue(costCard());

    render(<ActivityCardRow />);

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('$4,218')).toBeTruthy();
  });

  test('keeps the count cards when the eval cost failed', () => {
    vi.mocked(useActivityData).mockReturnValue({
      cards: [card(ActivityKind.SuitesRun), card(ActivityKind.SuitesAdded)],
      windows: WINDOWS,
    });
    vi.mocked(useEvalCostData).mockReturnValue(
      costCard({ status: CoverageStatus.Error, total: null, evaluateesCost: null, judgesCost: null }),
    );

    render(<ActivityCardRow />);

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getAllByText('10')).toHaveLength(2);
  });
});
