import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import QueryBuilderToolbar from '@/src/components/Analytics/QueryBuilder/Toolbar/QueryBuilderToolbar';
import { AnalyticsEntity } from '@/src/models/analytics/entity';

const ENTITIES: AnalyticsEntity[] = [{ name: 'dial_usage_log' }, { name: 'feedback' }];

const RANGE = { startDate: new Date('2026-07-01T00:00:00.000Z'), endDate: new Date('2026-07-13T00:00:00.000Z') };

const renderToolbar = (overrides: Partial<Parameters<typeof QueryBuilderToolbar>[0]> = {}) => {
  const props = {
    entities: ENTITIES,
    selectedEntityName: 'dial_usage_log',
    onSelectEntity: vi.fn(),
    timePeriod: '2d',
    onTimePeriodChange: vi.fn(),
    timeRange: RANGE,
    onTimeRangeChange: vi.fn(),
    onRun: vi.fn(),
    runDisabled: false,
    ...overrides,
  };
  render(<QueryBuilderToolbar {...props} />);
  return props;
};

describe('QueryBuilder :: QueryBuilderToolbar', () => {
  test('renders source select, time filter, and Run', () => {
    renderToolbar();

    expect(screen.getByText(/dial_usage_log/)).toBeInTheDocument();
    expect(screen.getByText(/Telemetry.TimePeriod/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeInTheDocument();
  });

  test('Run fires onRun and honors runDisabled', async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));
    expect(props.onRun).toHaveBeenCalled();
  });

  test('disabled Run does not fire', () => {
    renderToolbar({ runDisabled: true });
    expect(screen.getByRole('button', { name: /QueryBuilder.Run/ })).toBeDisabled();
  });

  test('renders extra actions via children', () => {
    render(
      <QueryBuilderToolbar
        entities={ENTITIES}
        selectedEntityName="dial_usage_log"
        onSelectEntity={vi.fn()}
        timePeriod="2d"
        onTimePeriodChange={vi.fn()}
        timeRange={RANGE}
        onTimeRangeChange={vi.fn()}
        onRun={vi.fn()}
        runDisabled={false}
      >
        <button>extra</button>
      </QueryBuilderToolbar>,
    );

    expect(screen.getByRole('button', { name: 'extra' })).toBeInTheDocument();
  });
});
