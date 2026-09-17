import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import RunBar from '@/src/components/TestSuites/Trends/CasePassRate/RunBar';
import { SEGMENT_BG_CLASSES } from '@/src/components/TestSuites/Trends/CasePassRate/constants';
import { CasePassRateBar, CasePassRateSegmentKind } from '@/src/components/TestSuites/Trends/models';
import { RunStatus } from '@/src/models/evaluation/run';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialTooltip: ({ children, tooltip }: { children: ReactNode; tooltip?: ReactNode }) => (
      <span>
        {children}
        <div role="tooltip">{tooltip}</div>
      </span>
    ),
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
  segments: [
    { kind: CasePassRateSegmentKind.Passed, percent: 91.666 },
    { kind: CasePassRateSegmentKind.Failed, percent: 6.25 },
    { kind: CasePassRateSegmentKind.Errored, percent: 2.083 },
  ],
  href: '/runs/nightly-1?id=run-1',
  ...overrides,
});

const renderBar = (overrides: Partial<CasePassRateBar> = {}, isLatest = false) =>
  render(<RunBar bar={bar(overrides)} isLatest={isLatest} />);

describe('RunBar', () => {
  test('renders the column as a link to the run detail page', () => {
    renderBar();

    const link = screen.getByRole('link', { name: /TestSuites.CasePassRateBarLabel/ });
    expect(link).toHaveAttribute('href', '/runs/nightly-1?id=run-1');
  });

  test('names the bar with the run, date and all four bucket counts', () => {
    renderBar();

    expect(screen.getByRole('link').getAttribute('aria-label')).toContain('TestSuites.CasePassRateBarLabel');
  });

  test('renders a non-interactive column when the run has no detail page', () => {
    renderBar({ href: null });

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('img', { name: /TestSuites.CasePassRateBarLabel/ })).toBeTruthy();
  });

  test('renders one segment per non-zero bucket', () => {
    const { container } = renderBar();

    expect(container.querySelectorAll(`.${SEGMENT_BG_CLASSES.passed}`)).toHaveLength(1);
    expect(container.querySelectorAll(`.${SEGMENT_BG_CLASSES.failed}`)).toHaveLength(1);
    expect(container.querySelectorAll(`.${SEGMENT_BG_CLASSES.errored}`)).toHaveLength(1);
  });

  test('renders no segment for a zero-count bucket', () => {
    const { container } = renderBar({ segments: [{ kind: CasePassRateSegmentKind.Passed, percent: 100 }] });

    expect(container.querySelectorAll(`.${SEGMENT_BG_CLASSES.failed}`)).toHaveLength(0);
    expect(container.querySelectorAll(`.${SEGMENT_BG_CLASSES.errored}`)).toHaveLength(0);
  });

  test('stacks segments from the bottom of the track', () => {
    const { container } = renderBar();

    const passed = container.querySelector<HTMLElement>(`.${SEGMENT_BG_CLASSES.passed}`);
    const failed = container.querySelector<HTMLElement>(`.${SEGMENT_BG_CLASSES.failed}`);
    expect(passed?.style.bottom).toBe('0%');
    expect(failed?.style.bottom).toBe('91.666%');
  });

  test('renders the run label rotated to read bottom-to-top', () => {
    renderBar();

    const label = screen.getByText('nightly-1');
    expect(label).toBeInTheDocument();
    expect(label.className).toContain('[writing-mode:vertical-rl]');
    expect(label.className).toContain('rotate-180');
  });

  test('shows the per-bucket counts in the tooltip', () => {
    renderBar();

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('44 Runs.Pass');
    expect(tooltip).toHaveTextContent('3 Runs.Fail');
    expect(tooltip).toHaveTextContent('1 Runs.ExecError');
    expect(tooltip).toHaveTextContent('0 Runs.NotScored');
  });

  test('marks a running run as in progress in the tooltip', () => {
    renderBar({ status: RunStatus.RUNNING });

    expect(screen.getByRole('tooltip')).toHaveTextContent('TestSuites.CasePassRateInProgress');
  });

  test('omits the in-progress line for a completed run', () => {
    renderBar();

    expect(screen.getByRole('tooltip')).not.toHaveTextContent('TestSuites.CasePassRateInProgress');
  });

  test('reports the unresolved remainder in the tooltip', () => {
    renderBar({ notRunCount: 6 });

    expect(screen.getByRole('tooltip')).toHaveTextContent('TestSuites.CasePassRateNotRun');
  });

  test('omits the not-run line when every row is accounted for', () => {
    renderBar();

    expect(screen.getByRole('tooltip')).not.toHaveTextContent('TestSuites.CasePassRateNotRun');
  });

  test('gives the latest bar the accent treatment', () => {
    const { container } = renderBar({}, true);

    expect(container.querySelector('.border-accent-primary')).toBeTruthy();
    expect(container.querySelector('.text-accent-primary')).toBeTruthy();
  });

  test('leaves a non-latest bar without the accent treatment', () => {
    const { container } = renderBar();

    expect(container.querySelector('.border-accent-primary')).toBeNull();
  });
});
