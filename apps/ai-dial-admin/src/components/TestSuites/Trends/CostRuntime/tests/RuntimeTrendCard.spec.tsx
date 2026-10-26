import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import RuntimeTrendCard from '@/src/components/TestSuites/Trends/CostRuntime/RuntimeTrendCard';
import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Spinner: () => <div>loader</div>,
  NoDataContent: ({ title }: { title: string }) => <div>{title}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  InteractiveTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const points: ComboTrendPoint[] = [{ runId: 'run-1', runName: 'Run #19', computedAtMs: 1, source: 100, metrics: 40 }];

describe('RuntimeTrendCard', () => {
  test('shows source runtime legend and rotated run-name axis label', async () => {
    render(<RuntimeTrendCard points={points} isLoading={false} sourceKind="Model" />);

    expect(await screen.findByRole('region', { name: TestSuitesI18nKey.RuntimeTrend })).toBeInTheDocument();
    expect(await screen.findByText(TestSuitesI18nKey.TrendsSourceRuntime)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsMetricsRuntime)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.TrendsTimeLine)).toBeInTheDocument();
    expect(await screen.findByText('#19')).toBeInTheDocument();
  });
});
