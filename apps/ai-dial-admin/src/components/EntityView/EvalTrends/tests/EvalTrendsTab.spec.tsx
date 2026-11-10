import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EvalTrendsTab from '@/src/components/EntityView/EvalTrends/EvalTrendsTab';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

const getTestSuitesForDeploymentMock = vi.fn();
const getDeploymentPeriodCostsMock = vi.fn();
const onOpenInNewTabMock = vi.fn();
const trendsRunCountChangeRef = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuitesForDeployment: (...args: unknown[]) => getTestSuitesForDeploymentMock(...args),
  getDeploymentPeriodCosts: (...args: unknown[]) => getDeploymentPeriodCostsMock(...args),
}));

vi.mock('@/src/utils/open-in-new-tab', () => ({
  onOpenInNewTab: (...args: unknown[]) => onOpenInNewTabMock(...args),
}));

vi.mock('@/src/components/TestSuites/Trends/Trends', () => ({
  default: ({
    selectedTestSuite,
    onTrendsRunCountChange,
    onStartRun,
  }: {
    selectedTestSuite: { id?: string; name?: string };
    onTrendsRunCountChange?: (runCount: number | null) => void;
    onStartRun?: () => void;
  }) => {
    if (onTrendsRunCountChange) {
      trendsRunCountChangeRef.mockImplementation(onTrendsRunCountChange);
      onTrendsRunCountChange(3);
    }
    return (
      <div data-testid="trends">
        {`trends-for-${selectedTestSuite.id}`}
        {onStartRun ? <span>has-start-run</span> : null}
      </div>
    );
  },
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Spinner: () => <div>loader</div>,
  Notification: ({ title, message }: { title?: string; message: React.ReactNode }) => (
    <div role="status">
      <p>{title}</p>
      <div>{message}</div>
    </div>
  ),
  NotificationType: { SectionMessage: 'section-message' },
  NotificationVariant: { Info: 'info' },
  ElementSize: { Small: 'small' },
  TooltipPlacement: { Left: 'left', Bottom: 'bottom' },
  GhostButton: ({
    label,
    onClick,
    iconAfter,
  }: {
    label: string;
    onClick?: () => void;
    iconAfter?: React.ReactNode;
  }) => (
    <button type="button" onClick={onClick}>
      {label}
      {iconAfter}
    </button>
  ),
  Select: ({
    options,
    value,
    searchable,
    searchPlaceholder,
    ariaLabel,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    ariaLabel?: string;
    onChange?: (next: string | string[]) => void;
  }) => (
    <div>
      <span>{ariaLabel}</span>
      <span data-testid="selected-suite">{value}</span>
      {searchable ? <span data-testid="suite-search">{searchPlaceholder}</span> : null}
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onChange?.(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
  Badge: ({ label }: { label: string }) => <span>{label}</span>,
  BadgeVariant: { Filled: 'filled' },
  BadgeColor: { Green: 'green', Red: 'red' },
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('EvalTrendsTab', () => {
  beforeEach(() => {
    getTestSuitesForDeploymentMock.mockReset();
    getDeploymentPeriodCostsMock.mockReset();
    onOpenInNewTabMock.mockReset();
    trendsRunCountChangeRef.mockReset();
    getDeploymentPeriodCostsMock.mockResolvedValue({
      current: { totalTestCaseCost: null, totalMetricEvalCost: null },
      previous: { totalTestCaseCost: null, totalMetricEvalCost: null },
    });
  });

  test('shows the empty state when suite loading fails', async () => {
    getTestSuitesForDeploymentMock.mockRejectedValue(new Error('network'));

    render(<EvalTrendsTab deploymentId="gpt-4" />);

    expect(await screen.findByText(TestSuitesI18nKey.EvalTrendsNoSuitesTitle)).toBeInTheDocument();
    expect(screen.queryByText('loader')).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.EvalTrendsMonthCostTitle)).not.toBeInTheDocument();
  });

  test('shows empty state when the entity has no suites', async () => {
    getTestSuitesForDeploymentMock.mockResolvedValue([]);

    render(<EvalTrendsTab deploymentId="gpt-4" />);

    expect(await screen.findByText(TestSuitesI18nKey.EvalTrendsNoSuitesTitle)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.EvalTrendsNoSuitesDescription)).toBeInTheDocument();
    expect(screen.queryByTestId('trends')).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.EvalTrendsAllSuitesTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.EvalTrendsMonthCostTitle)).not.toBeInTheDocument();
  });

  test('defaults to the first suite and switches Trends on selection', async () => {
    getTestSuitesForDeploymentMock.mockResolvedValue([
      { id: 'suite-a', name: 'alpha' },
      { id: 'suite-b', name: 'beta' },
    ]);

    render(<EvalTrendsTab deploymentId="gpt-4" />);

    expect(await screen.findByTestId('trends')).toHaveTextContent('trends-for-suite-a');
    expect(screen.getByTestId('selected-suite')).toHaveTextContent('suite-a');
    expect(screen.queryByText('has-start-run')).not.toBeInTheDocument();
    expect(screen.getByTestId('suite-search')).toHaveTextContent(BasicI18nKey.Search);
    expect(screen.getByText(TestSuitesI18nKey.EvalTrendsAllSuitesTitle)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.EvalTrendsMonthCostTitle)).toBeInTheDocument();
    const suiteLabel = screen
      .getAllByText(TestSuitesI18nKey.ViewInTestSuite)
      .find((node) => node.classList.contains('dial-small-semi-text'));
    expect(suiteLabel).toHaveClass('dial-small-semi-text', 'text-primary', 'whitespace-nowrap');

    await userEvent.click(screen.getByRole('button', { name: 'beta' }));

    expect(await screen.findByTestId('trends')).toHaveTextContent('trends-for-suite-b');
  });

  test('opens the selected suite in a new tab', async () => {
    getTestSuitesForDeploymentMock.mockResolvedValue([{ id: 'suite-1', name: 'suite-one' }]);

    render(<EvalTrendsTab deploymentId="app-1" />);

    expect(await screen.findByTestId('trends')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: TestSuitesI18nKey.OpenInNewTab }));

    expect(onOpenInNewTabMock).toHaveBeenCalledWith(ApplicationRoute.TestSuites, { id: 'suite-1' });
  });

  test('passes Trends run count into the Preview runs badge', async () => {
    getTestSuitesForDeploymentMock.mockResolvedValue([{ id: 'suite-1', name: 'suite-one' }]);

    render(<EvalTrendsTab deploymentId="app-1" />);

    await waitFor(() => {
      expect(screen.getByText(TestSuitesI18nKey.TrendsPreviewRunsLastN)).toBeInTheDocument();
    });
  });
});
