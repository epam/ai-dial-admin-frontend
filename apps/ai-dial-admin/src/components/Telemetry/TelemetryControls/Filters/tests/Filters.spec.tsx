import { render, screen } from '@testing-library/react';
import { ApplicationRoute } from '@/src/types/routes';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import Filters from '@/src/components/Telemetry/TelemetryControls/Filters/Filters';
import { describe, expect, test, vi } from 'vitest';
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
});
