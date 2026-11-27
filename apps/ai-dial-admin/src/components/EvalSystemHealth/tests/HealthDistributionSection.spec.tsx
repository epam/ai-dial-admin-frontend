import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HealthDistributionSection from '@/src/components/EvalSystemHealth/HealthDistributionSection';
import {
  CoverageStatus,
  HealthDistributionBar,
  HealthDistributionControlsProps,
  HealthDistributionData,
} from '@/src/components/EvalSystemHealth/models';
import { useHealthDistributionData } from '@/src/components/EvalSystemHealth/use-health-distribution-data';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

// The shared `t()` mock drops its params; this one keeps them so the threshold and week count can be asserted.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key),
  useCurrentLocale: () => 'en',
}));

vi.mock('@/src/components/EvalSystemHealth/use-health-distribution-data', () => ({
  useHealthDistributionData: vi.fn(),
}));
vi.mock('@/src/components/EvalSystemHealth/HealthDistributionControls', () => ({
  default: ({
    weeks,
    thresholdPercent,
    isModified,
    onWeeksChange,
    onThresholdPercentChange,
    onReset,
  }: HealthDistributionControlsProps) => (
    <div>
      <span>{`controls ${weeks} weeks at ${thresholdPercent}%${isModified ? ' modified' : ''}`}</span>
      <button onClick={() => onWeeksChange(12)}>pick 12 weeks</button>
      <button onClick={() => onThresholdPercentChange(90)}>pick 90 percent</button>
      <button onClick={onReset}>reset controls</button>
    </div>
  ),
}));
vi.mock('@/src/components/EvalSystemHealth/HealthDistributionChart', () => ({
  default: ({ bars }: { bars: HealthDistributionBar[] }) => <div>{`chart of ${bars.length} weeks`}</div>,
}));

const TITLE = `${EvalSystemHealthI18nKey.HealthDistribution}:${JSON.stringify({ count: 5 })}`;

const barOf = (label: string): HealthDistributionBar => ({
  weekStart: label.length,
  label,
  healthyCount: 3,
  failingCount: 1,
  suiteCount: 4,
  healthyShare: 75,
  failingShare: 25,
});

const retry = vi.fn();

const mockData = (overrides: Partial<HealthDistributionData> = {}) =>
  vi.mocked(useHealthDistributionData).mockReturnValue({
    status: CoverageStatus.Ready,
    bars: [barOf('Nov 3'), barOf('Nov 10')],
    threshold: 0.75,
    isEmpty: false,
    retry,
    ...overrides,
  });

describe('HealthDistributionSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('titles the section with the week count and puts the info control beside the heading', () => {
    mockData();
    render(<HealthDistributionSection />);

    expect(screen.getByRole('heading', { name: TITLE })).toBeTruthy();
    expect(screen.getByRole('button', { name: EvalSystemHealthI18nKey.HealthDistributionInfoLabel })).toBeTruthy();
  });

  test('shows the legend, the chart and the accessible table once loaded', () => {
    mockData();
    render(<HealthDistributionSection />);

    expect(screen.getByText('chart of 2 weeks')).toBeTruthy();
    expect(
      screen.getByText(
        `${EvalSystemHealthI18nKey.HealthDistributionLegendHealthy}:${JSON.stringify({ threshold: 0.75 })}`,
      ),
    ).toBeTruthy();
    expect(screen.getByRole('table', { name: TITLE })).toBeTruthy();
  });

  test('shows a loading indicator and no chart while the request is in flight', () => {
    mockData({ status: CoverageStatus.Loading, bars: [] });
    render(<HealthDistributionSection />);

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText(/^chart of/)).toBeNull();
  });

  test('shows the empty state and no chart, legend or table when no week has a suite', () => {
    mockData({ isEmpty: true });
    render(<HealthDistributionSection />);

    expect(screen.getByText(EvalSystemHealthI18nKey.HealthDistributionEmptyTitle)).toBeTruthy();
    expect(screen.getByText(EvalSystemHealthI18nKey.HealthDistributionEmptyDescription)).toBeTruthy();
    expect(screen.queryByText(/^chart of/)).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('listitem')).toBeNull();
  });

  test('announces a failure as an alert and requests the chart again on retry', async () => {
    const user = userEvent.setup();
    mockData({ status: CoverageStatus.Error, bars: [] });
    render(<HealthDistributionSection />);

    expect(screen.getByRole('alert')).toHaveTextContent(EvalSystemHealthI18nKey.HealthDistributionLoadFailed);
    await user.click(screen.getByRole('button', { name: EvalSystemHealthI18nKey.HealthDistributionRetry }));

    expect(retry).toHaveBeenCalledOnce();
  });

  test('keeps the heading and info control through a failure', () => {
    mockData({ status: CoverageStatus.Error, bars: [] });
    render(<HealthDistributionSection />);

    expect(screen.getByRole('heading', { name: TITLE })).toBeTruthy();
  });

  test('requests the defaults and shows the controls unmodified at first', () => {
    mockData();
    render(<HealthDistributionSection />);

    expect(useHealthDistributionData).toHaveBeenLastCalledWith(5, 0.75);
    expect(screen.getByText('controls 5 weeks at 75%')).toBeTruthy();
  });

  test('requests the chosen weeks and threshold and retitles the section', async () => {
    const user = userEvent.setup();
    mockData();
    render(<HealthDistributionSection />);

    await user.click(screen.getByRole('button', { name: 'pick 12 weeks' }));
    await user.click(screen.getByRole('button', { name: 'pick 90 percent' }));

    expect(useHealthDistributionData).toHaveBeenLastCalledWith(12, 0.9);
    expect(
      screen.getByRole('heading', {
        name: `${EvalSystemHealthI18nKey.HealthDistribution}:${JSON.stringify({ count: 12 })}`,
      }),
    ).toBeTruthy();
    expect(screen.getByText('controls 12 weeks at 90% modified')).toBeTruthy();
  });

  test('restores the defaults on reset', async () => {
    const user = userEvent.setup();
    mockData();
    render(<HealthDistributionSection />);

    await user.click(screen.getByRole('button', { name: 'pick 12 weeks' }));
    await user.click(screen.getByRole('button', { name: 'reset controls' }));

    expect(useHealthDistributionData).toHaveBeenLastCalledWith(5, 0.75);
    expect(screen.getByText('controls 5 weeks at 75%')).toBeTruthy();
  });

  test('keeps the controls through loading and failure so the user can change them', () => {
    mockData({ status: CoverageStatus.Loading, bars: [] });
    const { rerender } = render(<HealthDistributionSection />);
    expect(screen.getByText('controls 5 weeks at 75%')).toBeTruthy();

    mockData({ status: CoverageStatus.Error, bars: [] });
    rerender(<HealthDistributionSection />);
    expect(screen.getByText('controls 5 weeks at 75%')).toBeTruthy();
  });
});
