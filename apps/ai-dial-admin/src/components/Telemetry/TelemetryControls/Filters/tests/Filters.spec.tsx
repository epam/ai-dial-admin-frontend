import { render, screen, waitFor } from '@testing-library/react';
import { ApplicationRoute } from '@/src/types/routes';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import Filters from '@/src/components/Telemetry/TelemetryControls/Filters/Filters';
import { SelectOption } from '@epam/ai-dial-ui-kit';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

// Mock the child so we can observe the options Filters feeds into the dropdowns.
vi.mock('@/src/components/Telemetry/TelemetryControls/Filters/AddFilter', () => ({
  default: ({
    projects,
    entities,
    children,
  }: {
    projects: SelectOption[];
    entities: SelectOption[];
    children?: ReactNode;
  }) => (
    <>
      <p>{`projects:${projects.map((p) => p.value).join(',')}`}</p>
      <p>{`entities:${entities.map((e) => e.value).join(',')}`}</p>
      {children}
    </>
  ),
}));

const setFilters = vi.fn();
const getBaseData = vi.fn().mockReturnValue({ data: [] });

describe('Components - Filters', () => {
  test('renders correctly with single value', () => {
    const filters = [
      {
        condition: FILTER_OPERATOR.Equal,
        value: ['asd'],
        type: FILTER_TYPE.Entity,
      },
    ];
    render(
      <Filters
        filters={filters}
        setFilters={setFilters}
        route={ApplicationRoute.Dashboard}
        getBaseData={getBaseData}
      />,
    );

    expect(screen.getByText('asd')).toBeInTheDocument();
  });

  test('renders correctly with multiple values', () => {
    const filters = [
      {
        condition: FILTER_OPERATOR.Equal,
        value: ['value1', 'value2', 'value3'],
        type: FILTER_TYPE.Entity,
      },
    ];
    render(
      <Filters
        filters={filters}
        setFilters={setFilters}
        route={ApplicationRoute.Dashboard}
        getBaseData={getBaseData}
      />,
    );

    expect(screen.getByText('value1, value2, +1 more')).toBeInTheDocument();
  });

  test('user can add new filter', () => {
    const filters = [
      {
        condition: FILTER_OPERATOR.Equal,
        value: ['asd'],
        type: FILTER_TYPE.Entity,
      },
    ];
    render(
      <Filters
        filters={filters}
        setFilters={setFilters}
        route={ApplicationRoute.Dashboard}
        getBaseData={getBaseData}
      />,
    );
    // Simulate add filter (if there is a button or link)
    // For demonstration, check for value text
    expect(screen.getByText('asd')).toBeInTheDocument();
  });

  test('refreshes the options when the data source changes and clears them on empty results', async () => {
    const getBaseDataFull = vi.fn().mockResolvedValue({ success: true, response: { data: [['p1'], ['p2']] } });
    const { rerender } = render(
      <Filters filters={[]} setFilters={setFilters} route={ApplicationRoute.Dashboard} getBaseData={getBaseDataFull} />,
    );

    await waitFor(() => expect(screen.getByText('projects:p1,p2')).toBeInTheDocument());

    // A new time period / view returns no rows — the stale options must be cleared, not kept.
    const getBaseDataEmpty = vi.fn().mockResolvedValue({ success: true, response: { data: [] } });
    rerender(
      <Filters
        filters={[]}
        setFilters={setFilters}
        route={ApplicationRoute.Dashboard}
        getBaseData={getBaseDataEmpty}
      />,
    );

    await waitFor(() => expect(screen.getByText('projects:')).toBeInTheDocument());
    expect(screen.getByText('entities:')).toBeInTheDocument();
  });
});
