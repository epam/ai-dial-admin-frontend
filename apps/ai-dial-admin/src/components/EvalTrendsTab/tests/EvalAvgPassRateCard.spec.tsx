import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import EvalAvgPassRateCard from '@/src/components/EvalTrendsTab/EvalAvgPassRateCard';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

const getSuitePassRateMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getSuitePassRate: (...args: unknown[]) => getSuitePassRateMock(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Spinner: () => <div>loader</div>,
  Badge: ({ label, icon }: { label: string; icon?: React.ReactNode }) => (
    <span>
      {icon}
      {label}
    </span>
  ),
  BadgeVariant: { Filled: 'filled' },
  BadgeColor: { Green: 'green', Red: 'red' },
}));

describe('EvalAvgPassRateCard', () => {
  beforeEach(() => {
    getSuitePassRateMock.mockReset();
  });

  test('shows the percentage, trending-up badge, and footer', async () => {
    getSuitePassRateMock.mockResolvedValue({
      passRate: 0.613,
      previousPassRate: 0.5,
      suiteCount: 2,
      previousSuiteCount: 2,
    });

    render(<EvalAvgPassRateCard suiteIds={['suite-a', 'suite-b']} suiteCount={24} />);

    expect(await screen.findByText('61.3%')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.EvalTrendsAvgPassRateTitle)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.EvalTrendsTrendingUp)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.EvalTrendsBasedOnAllSuites)).toBeInTheDocument();
  });

  test('shows a trending-down badge when the mean fell', async () => {
    getSuitePassRateMock.mockResolvedValue({
      passRate: 0.4,
      previousPassRate: 0.6,
      suiteCount: 1,
      previousSuiteCount: 1,
    });

    render(<EvalAvgPassRateCard suiteIds={['suite-a']} suiteCount={1} />);

    expect(await screen.findByText('40%')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.EvalTrendsTrendingDown)).toBeInTheDocument();
  });

  test('omits the badge when the previous rate is missing', async () => {
    getSuitePassRateMock.mockResolvedValue({
      passRate: 0.5,
      previousPassRate: null,
      suiteCount: 1,
      previousSuiteCount: 0,
    });

    render(<EvalAvgPassRateCard suiteIds={['suite-a']} suiteCount={3} />);

    expect(await screen.findByText('50%')).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.EvalTrendsTrendingUp)).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.EvalTrendsTrendingDown)).not.toBeInTheDocument();
  });

  test('shows an em dash when the pass-rate request rejects', async () => {
    getSuitePassRateMock.mockRejectedValue(new Error('network'));

    render(<EvalAvgPassRateCard suiteIds={['suite-a']} suiteCount={2} />);

    expect((await screen.findAllByText('—')).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('loader')).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.EvalTrendsTrendingUp)).not.toBeInTheDocument();
  });
});
