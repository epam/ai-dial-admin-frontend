import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import CostTrendCard from '@/src/components/TestSuites/Trends/CostRuntime/CostTrendCard';
import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Spinner: () => <div>loader</div>,
  NoDataContent: ({ title }: { title: string }) => <div>{title}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  InteractiveTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const points: ComboTrendPoint[] = [{ runId: 'run-1', runName: 'Run #19', computedAtMs: 1, source: 1.5, metrics: 0.5 }];

describe('CostTrendCard', () => {
  test('shows source cost legend and rotated run-name axis label', async () => {
    render(<CostTrendCard points={points} isLoading={false} sourceKind="Application" />);

    expect(await screen.findByRole('region', { name: TestSuitesI18nKey.CostTrend })).toBeInTheDocument();
    expect(await screen.findByText(TestSuitesI18nKey.TrendsSourceCost)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsMetricsCost)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsCostLine)).toBeInTheDocument();
    expect(await screen.findByText('#19')).toBeInTheDocument();
  });
});
