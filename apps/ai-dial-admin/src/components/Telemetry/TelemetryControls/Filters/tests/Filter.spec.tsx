import { render } from '@testing-library/react';
import Filter from '@/src/components/Telemetry/TelemetryControls/Filters/Filter';
import { ApplicationRoute } from '@/src/types/routes';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import * as hookModule from '@/src/hooks/use-is-mobile-screen';
import { describe, expect, test, vi } from 'vitest';
const onEdit = vi.fn();
const onClose = vi.fn();

describe('Components - Filter', () => {
  test('renders correctly', () => {
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

  test('renders correctly in mobile', () => {
    vi.spyOn(hookModule, 'useIsMobileScreen').mockReturnValue(true);

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
