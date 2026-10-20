import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

let capturedAssetRolesProps: { asset?: { userRoles?: string[] }; onChange?: (asset: unknown) => void } | undefined;

vi.mock('@/src/components/EntityView/Roles/AssetRoles', () => ({
  default: (props: typeof capturedAssetRolesProps) => {
    capturedAssetRolesProps = props;
    return <section aria-label="asset-roles" />;
  },
}));

describe('TabsContent — Roles tab', () => {
  test('renders AssetRoles, presenting `user_roles` as `userRoles`, and round-trips without a stray `userRoles` key', () => {
    const selectedToolset = { name: 'toolset', user_roles: ['viewer'] } as unknown as AssetToolset;
    const originalToolset = selectedToolset;
    const onChange = vi.fn();

    render(
      <TabsContent
        activeTab={EntityViewTab.Roles}
        selectedToolset={selectedToolset}
        originalToolset={originalToolset}
        roles={[]}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText('asset-roles')).toBeInTheDocument();
    expect(capturedAssetRolesProps?.asset?.userRoles).toEqual(['viewer']);

    capturedAssetRolesProps?.onChange?.({ userRoles: ['admin'] });

    expect(onChange).toHaveBeenCalledOnce();
    const written = onChange.mock.calls[0][0] as AssetToolset & { user_roles?: string[] };
    expect(written.user_roles).toEqual(['admin']);
    expect(written).not.toHaveProperty('userRoles');
  });
});
