import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RunTrendsSection from '@/src/components/EvalSystemHealth/RunTrendsSection';
import { CoverageStatus, RunTrendRow, RunTrendsData } from '@/src/components/EvalSystemHealth/models';
import { useRunTrendsData } from '@/src/components/EvalSystemHealth/use-run-trends-data';
import { ButtonsI18nKey, EvalSystemHealthI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/components/EvalSystemHealth/use-run-trends-data', () => ({ useRunTrendsData: vi.fn() }));
vi.mock('@/src/components/EvalSystemHealth/RunTrendsTable', () => ({
  default: ({ rows }: { rows: RunTrendRow[] }) => (
    <div>{`table of ${rows.map((row) => row.suiteName).join(', ')}`}</div>
  ),
}));

const rowOf = (suiteName: string): RunTrendRow => ({
  suiteId: suiteName,
  suiteName,
  evaluateeName: 'GPT-4o',
  kindKey: EvalSystemHealthI18nKey.RunTrendsKindModel,
  points: [],
  latestRate: null,
  deltaLabel: null,
});

const goToPreviousPage = vi.fn();
const goToNextPage = vi.fn();
const retry = vi.fn();

const mockData = (overrides: Partial<RunTrendsData> = {}) =>
  vi.mocked(useRunTrendsData).mockReturnValue({
    status: CoverageStatus.Ready,
    rows: [rowOf('Regression'), rowOf('Docs')],
    page: 0,
    totalPages: 1,
    totalElements: 2,
    goToPreviousPage,
    goToNextPage,
    retry,
    ...overrides,
  });

describe('RunTrendsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows the heading and the table with the rows once loaded', () => {
    mockData();

    render(<RunTrendsSection />);

    expect(screen.getByRole('heading', { name: EvalSystemHealthI18nKey.RunTrends })).toBeTruthy();
    expect(screen.getByText('table of Regression, Docs')).toBeTruthy();
  });

  test('shows a loading indicator and no rows while a page loads', () => {
    mockData({ status: CoverageStatus.Loading, rows: [], totalPages: 0, totalElements: 0 });

    render(<RunTrendsSection />);

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText(/^table of/)).toBeNull();
  });

  test('says a run appears once its results are recorded when nothing has been recorded', () => {
    mockData({ rows: [], totalPages: 0, totalElements: 0 });

    render(<RunTrendsSection />);

    expect(screen.getByText(EvalSystemHealthI18nKey.RunTrendsEmptyTitle)).toBeTruthy();
    expect(screen.getByText(EvalSystemHealthI18nKey.RunTrendsEmptyDescription)).toBeTruthy();
    expect(screen.queryByText(/^table of/)).toBeNull();
  });

  test('shows an alert with a retry control when the request failed', async () => {
    const user = userEvent.setup();
    mockData({ status: CoverageStatus.Error, rows: [], totalPages: 0, totalElements: 0 });

    render(<RunTrendsSection />);
    await user.click(screen.getByRole('button', { name: EvalSystemHealthI18nKey.RunTrendsRetry }));

    expect(screen.getByRole('alert').textContent).toContain(EvalSystemHealthI18nKey.RunTrendsLoadFailed);
    expect(retry).toHaveBeenCalledOnce();
  });

  test('pages through the table with the pager', async () => {
    const user = userEvent.setup();
    mockData({ page: 1, totalPages: 3, totalElements: 25 });

    render(<RunTrendsSection />);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Previous }));

    expect(goToNextPage).toHaveBeenCalledOnce();
    expect(goToPreviousPage).toHaveBeenCalledOnce();
  });

  test('disables the pager while a page loads', () => {
    mockData({ status: CoverageStatus.Loading, rows: [], page: 1, totalPages: 3, totalElements: 25 });

    render(<RunTrendsSection />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeDisabled();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Previous })).toBeDisabled();
  });

  test('has no pager for a single page', () => {
    mockData({ totalPages: 1 });

    render(<RunTrendsSection />);

    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
