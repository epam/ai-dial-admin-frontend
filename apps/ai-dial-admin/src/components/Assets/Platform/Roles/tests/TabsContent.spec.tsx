import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { RolesI18nKey } from '@/src/constants/i18n';
import { DialRoleResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: () => <section aria-label="role-sharing" />,
}));

const role = { name: 'my-role', path: 'my-role', folderId: '' } as DialRoleResource;

describe('Role asset TabsContent', () => {
  test('Should render the Properties tab content when active', () => {
    render(<TabsContent activeTab={EntityViewTab.Properties} selectedRole={role} isSkipRefresh onChange={vi.fn()} />);

    expect(screen.getByText(RolesI18nKey.SetCostLimits)).toBeInTheDocument();
  });

  test('Should render nothing for a tab this surface does not have', () => {
    render(
      <TabsContent activeTab={EntityViewTab.ParameterSchema} selectedRole={role} isSkipRefresh onChange={vi.fn()} />,
    );

    expect(screen.queryByText(RolesI18nKey.SetCostLimits)).not.toBeInTheDocument();
  });
});
