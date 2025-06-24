import { render } from '@testing-library/react';
import { ApplicationRoute } from '@/src/types/routes';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import CreateFilter from '@/src/components/Telemetry/TelemetryControls/Filters/CreateFilter';
import { describe, expect, test, vi } from 'vitest';
const setValue = vi.fn();
const setCondition = vi.fn();
const setType = vi.fn();
const onClose = vi.fn();

describe('Components - CreateFilter', () => {
  test('renders correctly', () => {
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
