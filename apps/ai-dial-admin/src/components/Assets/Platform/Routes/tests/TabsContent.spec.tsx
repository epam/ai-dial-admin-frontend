import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { DialRole } from '@/src/models/dial/role';
import { DialRouteResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: () => <section aria-label="roles-grid" />,
}));

const route = { name: 'my-route', path: 'my-route', folderId: '' } as DialRouteResource;
const roles: DialRole[] = [{ name: 'admin', description: '' }];

describe('Route asset TabsContent', () => {
  test('Should render the Properties tab content when active', () => {
    render(
      <TabsContent
        activeTab={EntityViewTab.Properties}
        selectedRoute={route}
        originalRoute={route}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(EntityFieldsI18nKey.paths)).toBeInTheDocument();
  });

  test('Should render the Roles tab content when active', () => {
    render(
      <TabsContent
        activeTab={EntityViewTab.Roles}
        selectedRoute={{ ...route, userRoles: ['admin'] }}
        originalRoute={route}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTitle(RolesI18nKey.AddRoles)).toBeInTheDocument();
    expect(screen.queryByText(RolesI18nKey.NotAvailableRoute)).not.toBeInTheDocument();
  });

  test('Should render nothing for a tab this surface does not have', () => {
    render(
      <TabsContent
        activeTab={EntityViewTab.ParameterSchema}
        selectedRoute={route}
        originalRoute={route}
        roles={roles}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(EntityFieldsI18nKey.paths)).not.toBeInTheDocument();
  });
});
