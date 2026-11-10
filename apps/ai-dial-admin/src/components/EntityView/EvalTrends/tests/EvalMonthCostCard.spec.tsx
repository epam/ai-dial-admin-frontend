import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import EvalMonthCostCard from '@/src/components/EntityView/EvalTrends/EvalMonthCostCard';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

const getDeploymentPeriodCostsMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeploymentPeriodCosts: (...args: unknown[]) => getDeploymentPeriodCostsMock(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Spinner: () => <div>loader</div>,
  Tooltip: ({ children, tooltip }: { children: React.ReactNode; tooltip?: React.ReactNode }) => (
    <div>
      {children}
      <div data-testid="cost-tooltip">{tooltip}</div>
    </div>
  ),
  TooltipPlacement: { Bottom: 'bottom' },
  Badge: ({ label, icon }: { label: string; icon?: React.ReactNode }) => (
    <span>
      {icon}
      {label}
    </span>
  ),
  BadgeVariant: { Filled: 'filled' },
  BadgeColor: { Green: 'green', Red: 'red' },
}));

describe('EvalMonthCostCard', () => {
  beforeEach(() => {
    getDeploymentPeriodCostsMock.mockReset();
  });

  test('shows current cost, increase badge, footer, and both periods in the tooltip', async () => {
    getDeploymentPeriodCostsMock.mockResolvedValue({
      current: { totalTestCaseCost: 1800, totalMetricEvalCost: 42 },
      previous: { totalTestCaseCost: 1600, totalMetricEvalCost: 28 },
    });

    render(<EvalMonthCostCard deploymentId="gpt-4" suiteCount={24} />);

    expect((await screen.findAllByText('$1,842')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(TestSuitesI18nKey.EvalTrendsMonthCostTitle)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.EvalTrendsBasedOnAllSuites)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.EvalTrendsDeltaVsPrevPeriod)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('cost-tooltip')).toHaveTextContent('$1,842');
      expect(screen.getByTestId('cost-tooltip')).toHaveTextContent('$1,628');
    });
  });

  test('shows a decrease badge when spend fell', async () => {
    getDeploymentPeriodCostsMock.mockResolvedValue({
      current: { totalTestCaseCost: 100, totalMetricEvalCost: null },
      previous: { totalTestCaseCost: 250, totalMetricEvalCost: null },
    });

    render(<EvalMonthCostCard deploymentId="gpt-4" suiteCount={2} />);

    expect((await screen.findAllByText('$100')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(TestSuitesI18nKey.EvalTrendsDeltaVsPrevPeriod)).toBeInTheDocument();
  });

  test('shows an em dash without a badge when cost data is missing', async () => {
    getDeploymentPeriodCostsMock.mockResolvedValue({
      current: { totalTestCaseCost: null, totalMetricEvalCost: null },
      previous: { totalTestCaseCost: null, totalMetricEvalCost: null },
    });

    render(<EvalMonthCostCard deploymentId="gpt-4" suiteCount={1} />);

    expect((await screen.findAllByText('—')).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(TestSuitesI18nKey.EvalTrendsDeltaVsPrevPeriod)).not.toBeInTheDocument();
  });

  test('shows an em dash when the cost request rejects', async () => {
    getDeploymentPeriodCostsMock.mockRejectedValue(new Error('network'));

    render(<EvalMonthCostCard deploymentId="gpt-4" suiteCount={3} />);

    expect((await screen.findAllByText('—')).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('loader')).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.EvalTrendsDeltaVsPrevPeriod)).not.toBeInTheDocument();
  });

  test('shows an em dash when a period request fails and is treated as empty', async () => {
    getDeploymentPeriodCostsMock.mockResolvedValue({
      current: { totalTestCaseCost: null, totalMetricEvalCost: null },
      previous: { totalTestCaseCost: 50, totalMetricEvalCost: null },
    });

    render(<EvalMonthCostCard deploymentId="gpt-4" suiteCount={3} />);

    expect((await screen.findAllByText('—')).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(TestSuitesI18nKey.EvalTrendsDeltaVsPrevPeriod)).not.toBeInTheDocument();
  });
});
