import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialRouteResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

const route = { name: 'my-route', path: 'my-route', folderId: '' } as DialRouteResource;

describe('Route asset TabsContent', () => {
  test('Should render the Properties tab content when active', () => {
    render(
      <TabsContent
        activeTab={EntityViewTab.Properties}
        selectedRoute={route}
        originalRoute={route}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(EntityFieldsI18nKey.paths)).toBeInTheDocument();
  });

  test('Should render nothing for a tab this surface does not have', () => {
    render(
      <TabsContent
        activeTab={EntityViewTab.ParameterSchema}
        selectedRoute={route}
        originalRoute={route}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(EntityFieldsI18nKey.paths)).not.toBeInTheDocument();
  });
});
