import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import PassRateCard from '@/src/components/TestSuites/Trends/Kpi/PassRateCard';
import { RunTestCaseSegments } from '@/src/components/TestSuites/Trends/models';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

const segments: RunTestCaseSegments[] = [
  { runId: 'run-1', runName: 'Run#1', above: 66, below: 20, errorOrNa: 14, total: 100 },
  { runId: 'run-2', runName: 'Run#2', above: 98, below: 1, errorOrNa: 1, total: 100 },
];

describe('PassRateCard', () => {
  test('shows threshold pass rate, delta, and threshold footer when threshold is set', () => {
    render(<PassRateCard segments={segments} threshold={0.6} />);

    expect(screen.getByText(TestSuitesI18nKey.ThresholdPassRateOfLatestRun)).toBeInTheDocument();
    expect(screen.getByText('98%')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsDeltaVsPrev)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsThresholdLabel)).toBeInTheDocument();
    expect(screen.getByText('0.6')).toBeInTheDocument();
  });

  test('shows completion rate without threshold footer when threshold is unset', () => {
    render(<PassRateCard segments={segments} threshold={null} />);

    expect(screen.getByText(TestSuitesI18nKey.CompletionRateOfLatestRun)).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.TrendsThresholdLabel)).not.toBeInTheDocument();
  });
});
