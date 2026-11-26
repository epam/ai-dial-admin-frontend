import { ReactNode } from 'react';

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import SystemHealth from '@/src/components/EvalSystemHealth/SystemHealth';
import { CoverageCardModel, CoverageKind, CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { useCoverageData } from '@/src/components/EvalSystemHealth/use-coverage-data';
import { EvalSystemHealthI18nKey, MenuI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/components/EvalSystemHealth/use-coverage-data', () => ({ useCoverageData: vi.fn() }));
vi.mock('@/src/components/EvalSystemHealth/ActivityCardRow', () => ({
  default: ({ children }: { children?: ReactNode }) => (
    <div aria-label="key figures" role="group">
      {children}
      <span>activity cards</span>
    </div>
  ),
}));
vi.mock('@/src/components/EvalSystemHealth/RunTrendsSection', () => ({ default: () => <div>run trends</div> }));
vi.mock('@/src/components/EvalSystemHealth/HealthDistributionSection', () => ({
  default: () => <div>health distribution</div>,
}));

const card = (kind: CoverageKind, overrides: Partial<CoverageCardModel> = {}): CoverageCardModel => ({
  kind,
  status: CoverageStatus.Ready,
  total: 10,
  covered: 5,
  uncovered: 5,
  rate: 0.5,
  ...overrides,
});

const KINDS = [
  CoverageKind.Evaluatees,
  CoverageKind.Models,
  CoverageKind.Applications,
  CoverageKind.Toolsets,
  CoverageKind.Routes,
];

const allCards = (overrides: Partial<Record<CoverageKind, Partial<CoverageCardModel>>> = {}) =>
  KINDS.map((kind) => card(kind, overrides[kind]));

const isFollowing = (first: HTMLElement, second: HTMLElement) =>
  !!(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

const regionOf = (name: string) => screen.getByRole('region', { name });

describe('SystemHealth', () => {
  beforeEach(() => {
    vi.mocked(useCoverageData).mockReturnValue(allCards());
  });

  test('renders the page heading above the key figures, the coverage cards, the chart and the run trends', () => {
    render(<SystemHealth />);

    expect(screen.getByRole('heading', { level: 1, name: MenuI18nKey.SystemHealth })).toBeTruthy();
    expect(screen.getByText('activity cards')).toBeTruthy();
    expect(screen.getByText('health distribution')).toBeTruthy();
    expect(screen.getByText('run trends')).toBeTruthy();
  });

  test('loads the coverage data once for both places that draw its cards', () => {
    render(<SystemHealth />);

    expect(useCoverageData).toHaveBeenCalledOnce();
  });

  test('leads the key figures with the evaluatees card, before the activity cards', () => {
    render(<SystemHealth />);

    const keyFigures = screen.getByRole('group', { name: 'key figures' });
    expect(within(keyFigures).getByRole('region', { name: EvalSystemHealthI18nKey.TotalEvaluatees })).toBeTruthy();
    expect(isFollowing(regionOf(EvalSystemHealthI18nKey.TotalEvaluatees), screen.getByText('activity cards'))).toBe(
      true,
    );
  });

  test('holds the models, applications, toolsets and routes cards beside the chart, in that order', () => {
    render(<SystemHealth />);

    const distribution = screen.getByText('health distribution');
    const kindCards = within(distribution.parentElement as HTMLElement).getAllByRole('region');
    expect(kindCards.map((region) => region.getAttribute('aria-label'))).toEqual([
      EvalSystemHealthI18nKey.TotalModels,
      EvalSystemHealthI18nKey.TotalApplications,
      EvalSystemHealthI18nKey.TotalToolsets,
      EvalSystemHealthI18nKey.TotalRoutes,
    ]);
  });

  test('does not repeat the evaluatees card beside the chart', () => {
    render(<SystemHealth />);

    expect(screen.getAllByRole('region', { name: EvalSystemHealthI18nKey.TotalEvaluatees })).toHaveLength(1);
  });

  test('puts the coverage cards and the chart in one row, the cards first', () => {
    render(<SystemHealth />);

    const distribution = screen.getByText('health distribution');
    expect(isFollowing(regionOf(EvalSystemHealthI18nKey.TotalRoutes), distribution)).toBe(true);
    expect(distribution.parentElement).toBe(regionOf(EvalSystemHealthI18nKey.TotalModels).parentElement?.parentElement);
  });

  test('places the key figures first and the run trends last, on their own', () => {
    render(<SystemHealth />);

    const keyFigures = screen.getByRole('group', { name: 'key figures' });
    const runTrends = screen.getByText('run trends');
    expect(isFollowing(keyFigures, regionOf(EvalSystemHealthI18nKey.TotalModels))).toBe(true);
    expect(isFollowing(screen.getByText('health distribution'), runTrends)).toBe(true);
    expect(runTrends.parentElement).not.toBe(keyFigures.parentElement?.children[1]);
  });

  test('puts the alert on exactly the routes card and the evaluatees when the route listing failed', () => {
    vi.mocked(useCoverageData).mockReturnValue(
      allCards({
        [CoverageKind.Evaluatees]: { status: CoverageStatus.Error },
        [CoverageKind.Routes]: { status: CoverageStatus.Error },
      }),
    );

    render(<SystemHealth />);

    const hasAlert = (name: string) => within(regionOf(name)).queryByRole('alert') != null;
    expect(hasAlert(EvalSystemHealthI18nKey.TotalEvaluatees)).toBe(true);
    expect(hasAlert(EvalSystemHealthI18nKey.TotalRoutes)).toBe(true);
    expect(hasAlert(EvalSystemHealthI18nKey.TotalModels)).toBe(false);
    expect(hasAlert(EvalSystemHealthI18nKey.TotalApplications)).toBe(false);
    expect(hasAlert(EvalSystemHealthI18nKey.TotalToolsets)).toBe(false);
  });

  test('leaves the key figures without an evaluatees card when the hook returns none', () => {
    vi.mocked(useCoverageData).mockReturnValue(allCards().filter((item) => item.kind !== CoverageKind.Evaluatees));

    render(<SystemHealth />);

    expect(screen.queryByRole('region', { name: EvalSystemHealthI18nKey.TotalEvaluatees })).toBeNull();
  });
});
