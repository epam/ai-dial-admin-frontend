import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import SystemHealth from '@/src/components/EvalSystemHealth/SystemHealth';
import { MenuI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/components/EvalSystemHealth/CoverageCardRow', () => ({ default: () => <div>coverage row</div> }));
vi.mock('@/src/components/EvalSystemHealth/ActivityCardRow', () => ({ default: () => <div>activity row</div> }));
vi.mock('@/src/components/EvalSystemHealth/RunTrendsSection', () => ({ default: () => <div>run trends</div> }));
vi.mock('@/src/components/EvalSystemHealth/HealthDistributionPlaceholder', () => ({
  default: () => <div>health distribution</div>,
}));

const isFollowing = (first: HTMLElement, second: HTMLElement) =>
  !!(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('SystemHealth', () => {
  test('renders the page heading above the coverage, activity and run trends sections', () => {
    render(<SystemHealth />);

    expect(screen.getByRole('heading', { level: 1, name: MenuI18nKey.SystemHealth })).toBeTruthy();
    expect(screen.getByText('coverage row')).toBeTruthy();
    expect(screen.getByText('activity row')).toBeTruthy();
    expect(screen.getByText('run trends')).toBeTruthy();
    expect(screen.getByText('health distribution')).toBeTruthy();
  });

  test('places the activity row after the coverage row and the run trends after the activity row', () => {
    render(<SystemHealth />);

    expect(isFollowing(screen.getByText('coverage row'), screen.getByText('activity row'))).toBe(true);
    expect(isFollowing(screen.getByText('activity row'), screen.getByText('run trends'))).toBe(true);
  });

  test('puts the run trends and the chart placeholder in one row, the run trends first', () => {
    render(<SystemHealth />);

    const runTrends = screen.getByText('run trends');
    const distribution = screen.getByText('health distribution');
    expect(runTrends.parentElement).toBe(distribution.parentElement);
    expect(isFollowing(runTrends, distribution)).toBe(true);
  });
});
