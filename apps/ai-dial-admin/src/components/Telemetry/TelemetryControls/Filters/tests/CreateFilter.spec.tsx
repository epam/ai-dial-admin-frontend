import { render } from '@testing-library/react';
import { ApplicationRoute } from '@/src/types/routes';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import CreateFilter from '@/src/components/Telemetry/TelemetryControls/Filters/CreateFilter';

const setValue = jest.fn();
const setCondition = jest.fn();
const setType = jest.fn();
const onClose = jest.fn();

describe('Components - CreateFilter', () => {
  it('renders correctly', () => {
    const filter = {
      condition: FILTER_OPERATOR.Equal,
      value: 'asd',
      type: FILTER_TYPE.Entity,
    };
    const { getByTestId } = render(
      <CreateFilter
        type={filter.type}
        value={filter.value}
        condition={filter.condition}
        setType={setType}
        setCondition={setCondition}
        setValue={setValue}
        onClose={onClose}
        dropdownData={{ projects: [], entities: [] }}
        route={ApplicationRoute.Dashboard}
      />,
    );

    const createView = getByTestId('dashboard-create-filter');
    expect(createView).toBeTruthy();
  });
});
