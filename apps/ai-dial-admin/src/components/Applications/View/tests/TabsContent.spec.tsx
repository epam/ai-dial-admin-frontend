import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DialApplication } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

let capturedAssetRolesProps: { asset?: { userRoles?: string[] }; onChange?: (asset: unknown) => void } | undefined;
let capturedEntityRolesProps: { entity?: unknown; onChangeEntity?: (entity: unknown) => void } | undefined;

vi.mock('@/src/components/EntityView/Roles/AssetRoles', () => ({
  default: (props: typeof capturedAssetRolesProps) => {
    capturedAssetRolesProps = props;
    return <section aria-label="asset-roles" />;
  },
}));

vi.mock('@/src/components/EntityView/Roles/Roles', () => ({
  default: (props: typeof capturedEntityRolesProps) => {
    capturedEntityRolesProps = props;
    return <section aria-label="entity-roles" />;
  },
}));

const baseProps = {
  activeTab: EntityViewTab.Roles,
  applications: [],
  models: [],
  roles: [],
  interceptors: [],
  applicationSchemes: [],
  names: [],
  isSkipRefresh: true,
  isEditorEnabled: false,
  onChangeApplication: vi.fn(),
};

describe('TabsContent — Roles tab', () => {
  test('renders AssetRoles for the AssetsApplications view, presenting `user_roles` as `userRoles`', () => {
    const selectedApplication = { name: 'app', user_roles: ['viewer'] } as unknown as DialApplication;
    const onChangeApplication = vi.fn();

    render(
      <TabsContent
        {...baseProps}
        view={ApplicationRoute.AssetsApplications}
        selectedApplication={selectedApplication}
        onChangeApplication={onChangeApplication}
      />,
    );

    expect(screen.getByLabelText('asset-roles')).toBeInTheDocument();
    expect(screen.queryByLabelText('entity-roles')).not.toBeInTheDocument();
    expect(capturedAssetRolesProps?.asset?.userRoles).toEqual(['viewer']);

    capturedAssetRolesProps?.onChange?.({ userRoles: ['admin'] });

    expect(onChangeApplication).toHaveBeenCalledOnce();
    const written = onChangeApplication.mock.calls[0][0] as DialApplicationResource;
    expect(written.user_roles).toEqual(['admin']);
    expect(written).not.toHaveProperty('userRoles');
  });

  test('renders EntityRoles unchanged for the admin-BE Applications view', () => {
    const selectedApplication = { name: 'app' } as unknown as DialApplication;
    const onChangeApplication = vi.fn();

    render(
      <TabsContent
        {...baseProps}
        view={ApplicationRoute.Applications}
        selectedApplication={selectedApplication}
        onChangeApplication={onChangeApplication}
      />,
    );

    expect(screen.getByLabelText('entity-roles')).toBeInTheDocument();
    expect(screen.queryByLabelText('asset-roles')).not.toBeInTheDocument();
    expect(capturedEntityRolesProps?.entity).toBe(selectedApplication);

    capturedEntityRolesProps?.onChangeEntity?.({ name: 'app', roleLimits: {} });

    expect(onChangeApplication).toHaveBeenCalledWith({ name: 'app', roleLimits: {} });
  });
});
