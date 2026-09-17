import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import LatestRunDetail from '@/src/components/TestSuites/Trends/CasePassRate/LatestRunDetail';
import { CasePassRateBar, CasePassRateLatestDetail } from '@/src/components/TestSuites/Trends/models';
import { RunStatus } from '@/src/models/evaluation/run';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialTooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  };
});

const bar = (overrides: Partial<CasePassRateBar> = {}): CasePassRateBar => ({
  runId: 'run-1',
  label: 'nightly-1',
  createdAtMs: Date.UTC(2026, 8, 15, 12),
  status: RunStatus.COMPLETED,
  passedCount: 44,
  failedCount: 3,
  erroredCount: 1,
  notScoredCount: 0,
  totalCount: 48,
  notRunCount: 0,
  segments: [],
  href: '/runs/nightly-1?id=run-1',
  ...overrides,
});

const renderDetail = (overrides: Partial<CasePassRateLatestDetail> = {}) =>
  render(<LatestRunDetail detail={{ bar: bar(), passedDelta: 6, isLackingScoring: false, ...overrides }} />);

describe('LatestRunDetail', () => {
  test('renders the passed-over-total figure with its caption', () => {
    renderDetail();

    expect(screen.getByText('44')).toBeInTheDocument();
    expect(screen.getByText('/ 48')).toBeInTheDocument();
    expect(screen.getByText('TestSuites.CasesPassedCaption')).toBeInTheDocument();
  });

  test('links the run label to the run detail page', () => {
    renderDetail();

    expect(screen.getByRole('link', { name: 'nightly-1' })).toHaveAttribute('href', '/runs/nightly-1?id=run-1');
  });

  test('renders the run label as plain text when the run has no detail page', () => {
    renderDetail({ bar: bar({ href: null }) });

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('nightly-1')).toBeInTheDocument();
  });

  test('renders the fail, error and not-scored counts as separate statuses', () => {
    renderDetail({ bar: bar({ erroredCount: 1, notScoredCount: 2 }) });

    expect(screen.getByText('3 Runs.Fail')).toBeInTheDocument();
    expect(screen.getByText('1 Runs.ExecError')).toBeInTheDocument();
    expect(screen.getByText('2 Runs.NotScored')).toBeInTheDocument();
  });

  test('renders a positive delta with the success treatment', () => {
    const { container } = renderDetail({ passedDelta: 6 });

    expect(screen.getByText(/\+6/)).toBeInTheDocument();
    expect(container.querySelector('.text-accent-secondary.bg-accent-secondary-alpha')).toBeTruthy();
  });

  test('renders a zero delta with the success treatment', () => {
    const { container } = renderDetail({ passedDelta: 0 });

    expect(screen.getByText(/\+0/)).toBeInTheDocument();
    expect(container.querySelector('.bg-accent-secondary-alpha')).toBeTruthy();
  });

  test('renders a negative delta with the error treatment', () => {
    const { container } = renderDetail({ passedDelta: -6 });

    expect(screen.getByText(/-6/)).toBeInTheDocument();
    expect(container.querySelector('.bg-error.text-error')).toBeTruthy();
  });

  test('omits the delta chip when the window has a single run', () => {
    renderDetail({ passedDelta: null });

    expect(screen.queryByText('TestSuites.CasePassRateVsPrev')).toBeNull();
  });

  test('replaces the figure with the lack-scoring note when the run reached no verdict', () => {
    renderDetail({
      bar: bar({ passedCount: 0, failedCount: 0, notScoredCount: 48 }),
      isLackingScoring: true,
    });

    expect(screen.getByText('TestSuites.CasePassRateLackScoring')).toBeInTheDocument();
    expect(screen.queryByText('TestSuites.CasesPassedCaption')).toBeNull();
  });

  test('keeps the pass-rate figure when at least one row carries a verdict', () => {
    renderDetail({ bar: bar({ passedCount: 1, failedCount: 0, notScoredCount: 47 }) });

    expect(screen.getByText('TestSuites.CasesPassedCaption')).toBeInTheDocument();
    expect(screen.queryByText('TestSuites.CasePassRateLackScoring')).toBeNull();
  });
});
