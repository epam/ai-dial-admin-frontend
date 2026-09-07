'use client';

import { FC } from 'react';

import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import AssetRoles from '@/src/components/EntityView/Roles/AssetRoles';
import Tools from '@/src/components/Tools/Tools';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialRole } from '@/src/models/dial/role';
import { DialToolsetResource } from '@/src/models/dial/resource';
import { Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ToolsetAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  originalToolset: AssetToolset;
  selectedToolset: AssetToolset;
  roles?: DialRole[];
  onChange: (toolset: AssetToolset) => void;
}

const TabsContent: FC<Props> = ({ activeTab, onChange, selectedToolset, originalToolset, roles }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const onChangeResource = (toolset: DialToolsetResource) => {
    onChange({ ...selectedToolset, ...toolset } as AssetToolset);
  };

  /**
   * `AssetRoles` is generic over `{ userRoles?: string[] }`, but Core's `ToolSet` class is
   * `@JsonNaming(SnakeCaseStrategy)` and always serializes this field as `user_roles` (see
   * `DialToolsetResource.user_roles`'s doc comment) — unlike `Model`/`Route`, which are plain
   * camelCase. This adapts at the boundary rather than widening the shared component: presents
   * `user_roles` under the `userRoles` key `AssetRoles` expects, and translates back on change,
   * rebuilding from the current toolset rather than spreading `AssetRoles`'s own output so no stray
   * `userRoles` key reaches the write payload.
   */
  const onChangeAssetRoles = (updated: DialToolsetResource & { userRoles?: string[] }) => {
    onChangeResource({ user_roles: updated.userRoles } as DialToolsetResource);
  };

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <ToolsetAssetProperties
          selectedToolset={selectedToolset as unknown as DialToolsetResource}
          onChange={onChangeResource}
          isPublication={false}
        />
      )}

      {activeTab === EntityViewTab.Tools && (
        <Tools
          isAsset
          originalEntity={originalToolset}
          selectedEntity={selectedToolset}
          onChangeEntity={onChange as (toolset: Toolset) => void}
          disabled={isReadOnlyAdmin}
          view={ApplicationRoute.AssetsToolsets}
        />
      )}

      {activeTab === EntityViewTab.Roles && (
        <AssetRoles
          view={ApplicationRoute.AssetsToolsets}
          asset={{
            ...(selectedToolset as unknown as DialToolsetResource),
            userRoles: (selectedToolset as unknown as DialToolsetResource).user_roles,
          }}
          roles={roles || []}
          onChange={onChangeAssetRoles}
        />
      )}

      {activeTab === EntityViewTab.Audit && (
        <EntityAudit entity={selectedToolset} view={ApplicationRoute.AssetsToolsets} />
      )}
    </>
  );
};

export default TabsContent;
