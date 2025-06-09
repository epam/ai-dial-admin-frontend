import { render } from '@testing-library/react';
import { ApplicationRoute } from '@/src/types/routes';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import Filters from '@/src/components/Telemetry/TelemetryControls/Filters/Filters';

const setFilters = jest.fn();
const getData = jest.fn().mockReturnValue({ data: [] });

describe('Components - Filters', () => {
  it('renders correctly', () => {
    const filters = [
      {
        condition: FILTER_OPERATOR.Equal,
        value: 'asd',
        type: FILTER_TYPE.Entity,
      },
    ];
    const { getByTestId } = render(
      <Filters filters={filters} setFilters={setFilters} route={ApplicationRoute.Dashboard} getData={getData} />,
    );

    const filter = getByTestId('dashboard-filter');
    expect(filter).toBeTruthy();
  });

  it('user can aad new filter', () => {
    const filters = [
      {
        condition: FILTER_OPERATOR.Equal,
        value: 'asd',
        type: FILTER_TYPE.Entity,
      },
    ];
    const { getByTestId } = render(
      <Filters filters={filters} setFilters={setFilters} route={ApplicationRoute.Dashboard} getData={getData} />,
    );

    const filter = getByTestId('dashboard-filter');
    expect(filter).toBeTruthy();
  });
});
