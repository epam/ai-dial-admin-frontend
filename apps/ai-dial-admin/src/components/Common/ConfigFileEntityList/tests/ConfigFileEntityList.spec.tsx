import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { NAME_COLUMN_WITH_SORT } from '@/src/constants/grid-columns/base-columns';
import { ApplicationRoute } from '@/src/types/routes';
import ConfigFileEntityList from '../ConfigFileEntityList';

let capturedProps: Record<string, unknown> | undefined;
vi.mock('@/src/components/EntityListView/EntityListView', () => ({
  default: (props: Record<string, unknown>) => {
    capturedProps = props;
    return <div>base-entity-list</div>;
  },
}));

describe('ConfigFileEntityList', () => {
  test('renders one row per name', () => {
    render(<ConfigFileEntityList names={['first', 'second']} route={ApplicationRoute.Models} />);

    expect(capturedProps?.data).toEqual([{ name: 'first' }, { name: 'second' }]);
  });

  test('passes only the name column as base columns', () => {
    render(<ConfigFileEntityList names={['first']} route={ApplicationRoute.Models} />);

    expect(capturedProps?.baseColumns).toEqual([NAME_COLUMN_WITH_SORT]);
  });

  test('marks the data as config-file-sourced, and forwards the route and headerExtra', () => {
    const headerExtra = <div>toggle</div>;
    render(<ConfigFileEntityList names={[]} route={ApplicationRoute.PlatformModels} headerExtra={headerExtra} />);

    // BaseEntityList itself (EntityListView.spec.tsx) proves that isConfigFileSource=true threads
    // CONFIG_FILE_URL_SUFFIX into the open-in-new-tab row action; this component's own responsibility
    // is only to always pass that flag, asserted here.
    expect(capturedProps?.isConfigFileSource).toBe(true);
    expect(capturedProps?.route).toBe(ApplicationRoute.PlatformModels);
    expect(capturedProps?.headerExtra).toBe(headerExtra);
  });
});
