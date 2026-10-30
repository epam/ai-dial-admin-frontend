import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import TestCasesByRunCard from '@/src/components/TestSuites/Trends/TestCases/TestCasesByRunCard';
import { RunTestCaseSegments, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Spinner: () => <div>loader</div>,
  Notification: ({ message }: { message: string }) => <div role="alert">{message}</div>,
  NotificationVariant: { Error: 'error' },
  NotificationType: { SectionMessage: 'section-message', Toast: 'toast' },
  Tooltip: ({ children, tooltip }: { children: React.ReactNode; tooltip: React.ReactNode }) => (
    <div data-testid="label-tooltip" data-tooltip={typeof tooltip === 'string' ? tooltip : undefined}>
      {typeof tooltip === 'string' ? null : <div data-testid="bar-tooltip-content">{tooltip}</div>}
      {children}
    </div>
  ),
  InteractiveTooltip: ({ children, content }: { children: React.ReactNode; content: React.ReactNode }) => (
    <div data-testid="bar-tooltip-wrap">
      <div data-testid="bar-tooltip-content">{content}</div>
      {children}
    </div>
  ),
}));

const segments: RunTestCaseSegments[] = [
  { runId: 'run-1', runName: 'Run#1', overallScoreThreshold: 0.6, above: 8, below: 2, errorOrNa: 1, total: 11 },
  { runId: 'run-2', runName: 'Run#2', overallScoreThreshold: 0.6, above: 5, below: 0, errorOrNa: 0, total: 5 },
];

const thresholdRunOrder: TrendsRunPoint[] = segments.map((segment, computedAtMs) => ({
  ...segment,
  computedAtMs,
  overallScore: null,
  durationMs: null,
  isFailed: false,
}));

const unthresholdedRunOrder: TrendsRunPoint[] = [
  { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, overallScore: null, durationMs: null, isFailed: false },
];

describe('TestCasesByRunCard', () => {
  test('renders title, legend, and run bars with segment order error/below/above', () => {
    render(<TestCasesByRunCard segments={segments} runOrder={thresholdRunOrder} />);

    expect(screen.getByRole('region', { name: TabsI18nKey.TestCases })).toBeInTheDocument();
    expect(screen.getAllByText(TestSuitesI18nKey.TrendsScoreAboveThreshold).length).toBeGreaterThan(0);
    expect(screen.getAllByText(TestSuitesI18nKey.TrendsScoreBelowThreshold).length).toBeGreaterThan(0);
    expect(screen.getAllByText(TestSuitesI18nKey.TrendsTestCasesErrorOrNa).length).toBeGreaterThan(0);

    const bar1 = screen.getByRole('img', {
      name: `Run#1: 8 ${TestSuitesI18nKey.TrendsScoreAboveThreshold}, 2 ${TestSuitesI18nKey.TrendsScoreBelowThreshold}, 1 ${TestSuitesI18nKey.TrendsTestCasesErrorOrNa}`,
    });
    expect(bar1).toBeInTheDocument();

    const segmentEls = Array.from(bar1.children) as HTMLElement[];
    expect(segmentEls.map((el) => el.dataset.segment)).toEqual(['errorOrNa', 'below', 'above']);
    expect(segmentEls[0].style.flexGrow).toBe('1');
    expect(segmentEls[1].style.flexGrow).toBe('2');
    expect(segmentEls[2].style.flexGrow).toBe('8');
  });

  test('shows Completed / Error legend without Below when threshold is unset', () => {
    render(
      <TestCasesByRunCard
        segments={[
          {
            runId: 'run-1',
            runName: 'Run#1',
            overallScoreThreshold: null,
            above: 8,
            below: 2,
            errorOrNa: 1,
            total: 11,
          },
        ]}
        runOrder={unthresholdedRunOrder}
      />,
    );

    expect(screen.getAllByText(TestSuitesI18nKey.TrendsTestCasesCompleted).length).toBeGreaterThan(0);
    expect(screen.getAllByText(TestSuitesI18nKey.TrendsTestCasesErrorOrNa).length).toBeGreaterThan(0);
    expect(screen.queryByText(TestSuitesI18nKey.TrendsScoreBelowThreshold)).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.TrendsScoreAboveThreshold)).not.toBeInTheDocument();

    const bar = screen.getByRole('img', {
      name: `Run#1: 8 ${TestSuitesI18nKey.TrendsTestCasesCompleted}, 1 ${TestSuitesI18nKey.TrendsTestCasesErrorOrNa}`,
    });
    expect(Array.from(bar.children).map((el) => (el as HTMLElement).dataset.segment)).toEqual(['errorOrNa', 'above']);
  });

  test('bar tooltip includes nested above/below with threshold value when threshold is set', () => {
    render(
      <TestCasesByRunCard
        segments={[
          {
            runId: 'run-1',
            runName: 'Run#19',
            overallScoreThreshold: 0.6,
            above: 120,
            below: 20,
            errorOrNa: 10,
            total: 150,
          },
        ]}
        runOrder={[
          {
            runId: 'run-1',
            runName: 'Run#19',
            computedAtMs: 1,
            overallScore: null,
            overallScoreThreshold: 0.6,
            durationMs: null,
            isFailed: false,
          },
        ]}
      />,
    );

    const runLink = screen.getByRole('link', { name: 'Run#19' });
    const tooltip = runLink.closest('div')?.parentElement;
    expect(tooltip).toHaveTextContent('Run#19');
    expect(tooltip).toHaveTextContent(TestSuitesI18nKey.TrendsTotalTestCases);
    expect(tooltip).toHaveTextContent('150');
    expect(tooltip).toHaveTextContent(TestSuitesI18nKey.TrendsTestCasesCompleted);
    expect(tooltip).toHaveTextContent('140');
    expect(tooltip).toHaveTextContent(`${TestSuitesI18nKey.TrendsScoreAboveThreshold} (0.6)`);
    expect(tooltip).toHaveTextContent('120');
    expect(tooltip).toHaveTextContent(`${TestSuitesI18nKey.TrendsScoreBelowThreshold} (0.6)`);
    expect(tooltip).toHaveTextContent('20');
    expect(tooltip).toHaveTextContent(TestSuitesI18nKey.TrendsTestCasesErrorOrNa);
    expect(tooltip).toHaveTextContent('10');
  });

  test('bar tooltip shows Completed and Error only when threshold is unset', () => {
    render(
      <TestCasesByRunCard
        segments={[
          {
            runId: 'run-1',
            runName: 'Run#19',
            overallScoreThreshold: null,
            above: 140,
            below: 0,
            errorOrNa: 10,
            total: 150,
          },
        ]}
        runOrder={[{ ...unthresholdedRunOrder[0], runName: 'Run#19' }]}
      />,
    );

    const runLink = screen.getByRole('link', { name: 'Run#19' });
    const tooltip = runLink.closest('div')?.parentElement;
    expect(tooltip).toHaveTextContent('Run#19');
    expect(tooltip).toHaveTextContent(TestSuitesI18nKey.TrendsTotalTestCases);
    expect(tooltip).toHaveTextContent('150');
    expect(tooltip).toHaveTextContent(TestSuitesI18nKey.TrendsTestCasesCompleted);
    expect(tooltip).toHaveTextContent('140');
    expect(tooltip).toHaveTextContent(TestSuitesI18nKey.TrendsTestCasesErrorOrNa);
    expect(tooltip).toHaveTextContent('10');
    expect(tooltip).not.toHaveTextContent(TestSuitesI18nKey.TrendsScoreAboveThreshold);
    expect(tooltip).not.toHaveTextContent(TestSuitesI18nKey.TrendsScoreBelowThreshold);
  });

  test('shows loader when loading with no segments yet', () => {
    render(<TestCasesByRunCard segments={[]} runOrder={unthresholdedRunOrder} isLoading />);

    expect(screen.getByText('loader')).toBeInTheDocument();
  });

  test('truncates long run labels and exposes the full name in a tooltip', () => {
    const longName = '116181d1-cf76-4c07-af7b-647c90ce3916';
    render(
      <TestCasesByRunCard
        segments={[{ runId: 'run-x', runName: longName, above: 1, below: 0, errorOrNa: 0, total: 1 }]}
        runOrder={[
          { runId: 'run-x', runName: longName, computedAtMs: 1, overallScore: null, durationMs: null, isFailed: false },
        ]}
      />,
    );

    expect(screen.getByTestId('label-tooltip')).toHaveAttribute('data-tooltip', longName);
    const label = screen.getByTestId('label-tooltip').querySelector('.line-clamp-2');
    expect(label).toHaveTextContent(longName);
  });

  test('strips leading Run from axis labels while keeping full name in tooltip', () => {
    render(
      <TestCasesByRunCard
        segments={[{ runId: 'run-1', runName: 'Run #19', above: 1, below: 0, errorOrNa: 0, total: 1 }]}
        runOrder={[{ ...unthresholdedRunOrder[0], runName: 'Run #19' }]}
      />,
    );

    expect(screen.getByTestId('label-tooltip')).toHaveAttribute('data-tooltip', 'Run #19');
    expect(screen.getByTestId('label-tooltip').querySelector('.line-clamp-2')).toHaveTextContent('#19');
  });

  test('shows both completion and threshold legend entries for mixed run snapshots', () => {
    render(
      <TestCasesByRunCard
        segments={[
          { ...segments[0], overallScoreThreshold: 0.6 },
          { ...segments[1], overallScoreThreshold: null, above: 5, below: 0 },
        ]}
        runOrder={[thresholdRunOrder[0], { ...unthresholdedRunOrder[0], runId: 'run-2', runName: 'Run#2' }]}
      />,
    );

    expect(screen.getAllByText(TestSuitesI18nKey.TrendsTestCasesCompleted)).toHaveLength(3);
    expect(screen.getByText(TestSuitesI18nKey.TrendsScoreAboveThreshold)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsScoreBelowThreshold)).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: `Run#2: 5 ${TestSuitesI18nKey.TrendsTestCasesCompleted}, 0 ${TestSuitesI18nKey.TrendsTestCasesErrorOrNa}`,
      }),
    ).toBeInTheDocument();
  });
});
