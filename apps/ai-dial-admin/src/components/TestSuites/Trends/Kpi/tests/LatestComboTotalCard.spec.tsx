import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import { formatRunCost } from '@/src/components/Runs/Summary/utils';
import LatestComboTotalCard from '@/src/components/TestSuites/Trends/Kpi/LatestComboTotalCard';
import { formatCostDelta, formatRuntimeDelta } from '@/src/components/TestSuites/Trends/Kpi/utils/kpi-delta';
import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';
import { formatSuiteRunTime } from '@/src/components/TestSuites/Trends/utils/format';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

const costPoints: ComboTrendPoint[] = [
  { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, source: 4, metrics: 1.7 },
  { runId: 'run-2', runName: 'Run#2', computedAtMs: 2, source: 9, metrics: 1.7 },
];

const runtimePoints: ComboTrendPoint[] = [
  { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, source: 331000, metrics: 291000 },
  { runId: 'run-2', runName: 'Run#2', computedAtMs: 2, source: 341000, metrics: 291000 },
];

describe('LatestComboTotalCard', () => {
  test('shows latest total cost, delta, and source/metrics breakdown', () => {
    render(
      <LatestComboTotalCard
        points={costPoints}
        sourceLabel="Application"
        title={TestSuitesI18nKey.TotalCostOfLatestRun}
        formatValue={(value) => formatRunCost(value) ?? '—'}
        formatDelta={formatCostDelta}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.TotalCostOfLatestRun)).toBeInTheDocument();
    expect(screen.getByText('$10.7')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsDeltaVsPrev)).toBeInTheDocument();
    expect(screen.getByText('Application:')).toBeInTheDocument();
    expect(screen.getByText('$9')).toBeInTheDocument();
    expect(screen.getByText(`${TestSuitesI18nKey.TrendsMetricsLabel}:`)).toBeInTheDocument();
    expect(screen.getByText('$1.7')).toBeInTheDocument();
  });

  test('shows latest total runtime, delta, and source/metrics breakdown', () => {
    render(
      <LatestComboTotalCard
        points={runtimePoints}
        sourceLabel="Application"
        title={TestSuitesI18nKey.TotalRuntimeOfLatestRun}
        formatValue={(value) => (value != null && Number.isFinite(value) ? formatSuiteRunTime(value) : '—')}
        formatDelta={formatRuntimeDelta}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.TotalRuntimeOfLatestRun)).toBeInTheDocument();
    expect(screen.getByText('632s')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsDeltaVsPrev)).toBeInTheDocument();
    expect(screen.getByText('Application:')).toBeInTheDocument();
    expect(screen.getByText('341s')).toBeInTheDocument();
    expect(screen.getByText(`${TestSuitesI18nKey.TrendsMetricsLabel}:`)).toBeInTheDocument();
    expect(screen.getByText('291s')).toBeInTheDocument();
  });
});
