import { render } from '@testing-library/react';
import Filter from '@/src/components/Telemetry/TelemetryControls/Filters/Filter';
import { ApplicationRoute } from '@/src/types/routes';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import * as hookModule from '@/src/hooks/use-is-mobile-screen';

const onEdit = jest.fn();
const onClose = jest.fn();

describe('Components - Filter', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(
      <Filter
        id={1}
        route={ApplicationRoute.Dashboard}
        filterData={{
          condition: FILTER_OPERATOR.Equal,
          value: 'asd',
          type: FILTER_TYPE.Entity,
        }}
        onEdit={onEdit}
        onClose={onClose}
        dropdownData={{ projects: [], entities: [] }}
      />,
    );

    const filter = getByTestId('dashboard-filter');
    expect(filter).toBeTruthy();
  });

  it('renders correctly in mobile', () => {
    jest.spyOn(hookModule, 'useIsMobileScreen').mockReturnValue(true);

    const { getByTestId } = render(
      <Filter
        id={1}
        route={ApplicationRoute.Dashboard}
        filterData={{
          condition: FILTER_OPERATOR.Equal,
          value: 'asd',
          type: FILTER_TYPE.Entity,
        }}
        onEdit={onEdit}
        onClose={onClose}
        dropdownData={{ projects: [], entities: [] }}
      />,
    );

    const filter = getByTestId('dashboard-filter');
    expect(filter).toBeTruthy();
  });
});
