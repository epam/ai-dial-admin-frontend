import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import MetricSelection from '../MetricSelection';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialNoDataContent: ({ title }: any) => (
    <div role="status" aria-label={title}>
      {title}
    </div>
  ),
}));

vi.mock('@/src/components/Common/Search/Search', () => ({
  default: ({ onChange }: any) => (
    <input type="search" role="searchbox" aria-label="search" onChange={(e) => onChange(e.target.value)} />
  ),
}));

describe('MetricSelection', () => {
  const metrics: Metric[] = [
    { id: 'metric-1', name: 'Alpha Metric', description: 'First metric' },
    { id: 'metric-2', name: 'Beta Metric', description: 'Second metric' },
    { id: 'metric-3', name: 'Gamma Metric', description: 'Third metric' },
  ];

  test('renders metrics heading', () => {
    render(<MetricSelection metrics={metrics} />);

    expect(screen.getByText(TabsI18nKey.Metrics)).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(<MetricSelection metrics={metrics} />);

    expect(screen.getByRole('searchbox', { name: 'search' })).toBeInTheDocument();
  });

  test('renders all metrics when no filter is applied', () => {
    render(<MetricSelection metrics={metrics} />);

    expect(screen.getByText('Alpha Metric')).toBeInTheDocument();
    expect(screen.getByText('Beta Metric')).toBeInTheDocument();
    expect(screen.getByText('Gamma Metric')).toBeInTheDocument();
  });

  test('renders metric descriptions', () => {
    render(<MetricSelection metrics={metrics} />);

    expect(screen.getByText('First metric')).toBeInTheDocument();
    expect(screen.getByText('Second metric')).toBeInTheDocument();
    expect(screen.getByText('Third metric')).toBeInTheDocument();
  });

  test('shows no data content when metrics list is empty', () => {
    render(<MetricSelection metrics={[]} />);

    expect(screen.getByRole('status', { name: EntitiesI18nKey.NoMetrics })).toBeInTheDocument();
  });

  test('filters metrics by search pattern', async () => {
    const user = userEvent.setup();
    render(<MetricSelection metrics={metrics} />);

    await user.type(screen.getByRole('searchbox', { name: 'search' }), 'alpha');

    expect(screen.getByText('Alpha Metric')).toBeInTheDocument();
    expect(screen.queryByText('Beta Metric')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Metric')).not.toBeInTheDocument();
  });

  test('shows no data content when search matches nothing', async () => {
    const user = userEvent.setup();
    render(<MetricSelection metrics={metrics} />);

    await user.type(screen.getByRole('searchbox', { name: 'search' }), 'xyz-no-match');

    expect(screen.getByRole('status', { name: EntitiesI18nKey.NoMetrics })).toBeInTheDocument();
  });

  test('calls onSelectMetric with metric id when metric is clicked', async () => {
    const user = userEvent.setup();
    const onSelectMetric = vi.fn();
    render(<MetricSelection metrics={metrics} onSelectMetric={onSelectMetric} />);

    await user.click(screen.getByText('Alpha Metric'));

    expect(onSelectMetric).toHaveBeenCalledWith('metric-1');
  });

  test('does not throw when onSelectMetric is not provided', async () => {
    const user = userEvent.setup();
    render(<MetricSelection metrics={metrics} />);

    await expect(user.click(screen.getByText('Alpha Metric'))).resolves.not.toThrow();
  });

  test('filter is case-insensitive', async () => {
    const user = userEvent.setup();
    render(<MetricSelection metrics={metrics} />);

    await user.type(screen.getByRole('searchbox', { name: 'search' }), 'BETA');

    expect(screen.getByText('Beta Metric')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Metric')).not.toBeInTheDocument();
  });
});
