import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import CasePassRatePanel from '@/src/components/TestSuites/Trends/CasePassRate/CasePassRatePanel';
import { CasePassRateBar, CasePassRateSegmentKind } from '@/src/components/TestSuites/Trends/models';
import { RunStatus } from '@/src/models/evaluation/run';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialTooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  };
});

const bar = (index: number): CasePassRateBar => ({
  runId: `run-${index}`,
  label: `nightly-${index}`,
  createdAtMs: Date.UTC(2026, 8, index),
  status: RunStatus.COMPLETED,
  passedCount: 40 + index,
  failedCount: 3,
  erroredCount: 1,
  notScoredCount: 0,
  totalCount: 48,
  notRunCount: 4 - index,
  segments: [{ kind: CasePassRateSegmentKind.Passed, percent: 80 }],
  href: `/runs/nightly-${index}?id=run-${index}`,
});

const bars = (count: number): CasePassRateBar[] => Array.from({ length: count }, (_, index) => bar(index + 1));

describe('CasePassRatePanel', () => {
  test('renders the panel title with the window label', () => {
    render(<CasePassRatePanel bars={bars(3)} />);

    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent('TestSuites.CasesPassed');
    expect(heading).toHaveTextContent('TestSuites.TrendsLastNRuns');
  });

  test('renders one bar per run in the window', () => {
    render(<CasePassRatePanel bars={bars(4)} />);

    expect(screen.getAllByRole('link', { name: /TestSuites.CasePassRateBarLabel/ })).toHaveLength(4);
  });

  test('does not pad a short window with empty tracks', () => {
    render(<CasePassRatePanel bars={bars(4)} />);

    expect(screen.getAllByRole('link', { name: /TestSuites.CasePassRateBarLabel/ })).not.toHaveLength(10);
  });

  test('orders the bars oldest first', () => {
    render(<CasePassRatePanel bars={bars(3)} />);

    const labels = screen
      .getAllByRole('link', { name: /TestSuites.CasePassRateBarLabel/ })
      .map((link) => link.textContent);
    expect(labels).toEqual(['nightly-1', 'nightly-2', 'nightly-3']);
  });

  test('renders the latest-run readout', () => {
    render(<CasePassRatePanel bars={bars(3)} />);

    expect(screen.getByText('TestSuites.CasesPassedCaption')).toBeInTheDocument();
  });

  test('heads the latest-run column from the card header at wide widths and from the readout below', () => {
    render(<CasePassRatePanel bars={bars(3)} />);

    // One copy per breakpoint: the header cell is `xl:block`, the readout's own is `xl:hidden`.
    expect(screen.getAllByText('TestSuites.TrendsLatestRun')).toHaveLength(2);
  });

  test('fills the half of the row it is given', () => {
    const { container } = render(<CasePassRatePanel bars={bars(3)} />);

    expect(container.querySelector('section.h-full.w-full')).toBeTruthy();
  });

  test('grows the chart column so the readout ends flush with the card edge', () => {
    const { container } = render(<CasePassRatePanel bars={bars(3)} />);

    // The readout is only right-aligned with its header heading while the chart column grows.
    expect(container.querySelector('.flex-1.flex-col')).toBeTruthy();
  });

  test('renders the colour legend', () => {
    render(<CasePassRatePanel bars={bars(3)} />);

    expect(screen.getByText('Runs.Pass')).toBeInTheDocument();
    expect(screen.getByText('Runs.Fail')).toBeInTheDocument();
    expect(screen.getByText('Runs.ExecError')).toBeInTheDocument();
    expect(screen.getByText('Runs.NotScored')).toBeInTheDocument();
  });

  test('renders empty tracks and no bars while loading', () => {
    render(<CasePassRatePanel bars={null} isLoading />);

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryByText('TestSuites.CasePassRateUnavailable')).toBeNull();
  });

  test('reports the data as unavailable when the request failed', () => {
    render(<CasePassRatePanel bars={null} />);

    expect(screen.getByRole('status')).toHaveTextContent('TestSuites.CasePassRateUnavailable');
  });

  test('reports that the suite has no runs yet for an empty window', () => {
    render(<CasePassRatePanel bars={[]} />);

    expect(screen.getByRole('status')).toHaveTextContent('TestSuites.TrendsNoRunsTitle');
  });

  test('renders a single run without a delta chip', () => {
    render(<CasePassRatePanel bars={bars(1)} />);

    expect(screen.getAllByRole('link', { name: /TestSuites.CasePassRateBarLabel/ })).toHaveLength(1);
    expect(screen.queryByText('TestSuites.CasePassRateVsPrev')).toBeNull();
  });
});
