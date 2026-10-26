import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import LatestRunCard from '@/src/components/TestSuites/Trends/TestCases/LatestRunCard';
import { RunTestCaseSegments } from '@/src/components/TestSuites/Trends/models';
import { TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="gauge-chart" />,
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Spinner: () => <div>loader</div>,
  Notification: ({ message }: { message: string }) => <div role="alert">{message}</div>,
  NotificationVariant: { Error: 'error' },
  NotificationType: { SectionMessage: 'section-message', Toast: 'toast' },
  EllipsisTooltip: ({ text, className }: { text: string; className?: string }) => (
    <span data-testid="tooltip" data-tooltip={text} className={className}>
      {text}
    </span>
  ),
}));

const segments: RunTestCaseSegments = {
  runId: 'run-28',
  runName: 'Run #28',
  above: 120,
  below: 10,
  errorOrNa: 20,
  total: 150,
};

describe('LatestRunCard', () => {
  test('renders title, run name, center total, and threshold legend', () => {
    render(<LatestRunCard segments={segments} hasThreshold />);

    expect(screen.getByRole('region', { name: TestSuitesI18nKey.TrendsLatestRun })).toBeInTheDocument();
    expect(screen.getByText('Run #28')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText(TabsI18nKey.TestCases)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsScoreAboveThreshold)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsScoreBelowThreshold)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsTestCasesErrorOrNa)).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByTestId('gauge-chart')).toBeInTheDocument();
  });

  test('shows Completed / Error legend without Below when threshold is unset', () => {
    render(
      <LatestRunCard
        segments={{ ...segments, above: 130, below: 0, errorOrNa: 20, total: 150 }}
        hasThreshold={false}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.TrendsTestCasesCompleted)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsTestCasesErrorOrNa)).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.TrendsScoreBelowThreshold)).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.TrendsScoreAboveThreshold)).not.toBeInTheDocument();
    expect(screen.getByText('130')).toBeInTheDocument();
  });

  test('shows loader when loading with no segments yet', () => {
    render(<LatestRunCard segments={null} isLoading />);

    expect(screen.getByText('loader')).toBeInTheDocument();
  });

  test('exposes the full run name in a tooltip', () => {
    const longName = '116181d1-cf76-4c07-af7b-647c90ce3916';
    render(<LatestRunCard segments={{ ...segments, runName: longName }} hasThreshold />);

    expect(screen.getByTestId('tooltip')).toHaveAttribute('data-tooltip', longName);
  });
});
