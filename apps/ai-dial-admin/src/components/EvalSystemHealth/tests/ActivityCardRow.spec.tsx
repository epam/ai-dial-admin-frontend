import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ActivityCardRow from '@/src/components/EvalSystemHealth/ActivityCardRow';
import { ActivityCardModel, ActivityKind, CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { useActivityData } from '@/src/components/EvalSystemHealth/use-activity-data';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/components/EvalSystemHealth/use-activity-data', () => ({ useActivityData: vi.fn() }));

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

describe('ActivityCardRow', () => {
  test('renders the two activity cards in order', () => {
    vi.mocked(useActivityData).mockReturnValue({
      cards: [card(ActivityKind.SuitesRun), card(ActivityKind.SuitesAdded)],
      windows: WINDOWS,
    });

    render(<ActivityCardRow />);

    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual([
      EvalSystemHealthI18nKey.SuitesRunThisMonth,
      EvalSystemHealthI18nKey.SuitesAddedThisMonth,
    ]);
  });

  test('keeps the other card when one failed', () => {
    vi.mocked(useActivityData).mockReturnValue({
      cards: [card(ActivityKind.SuitesRun), card(ActivityKind.SuitesAdded, { status: CoverageStatus.Error })],
      windows: WINDOWS,
    });

    render(<ActivityCardRow />);

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByText('10')).toBeTruthy();
  });
});
