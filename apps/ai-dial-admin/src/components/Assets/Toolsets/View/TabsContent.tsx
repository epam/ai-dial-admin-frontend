'use client';

import { FC } from 'react';

import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import Tools from '@/src/components/Tools/Tools';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialToolsetResource } from '@/src/models/dial/resource';
import { Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ToolsetAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  originalToolset: AssetToolset;
  selectedToolset: AssetToolset;
  onChange: (toolset: AssetToolset) => void;
}

const TabsContent: FC<Props> = ({ activeTab, onChange, selectedToolset, originalToolset }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const onChangeResource = (toolset: DialToolsetResource) => {
    onChange({ ...selectedToolset, ...toolset } as AssetToolset);
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

      {activeTab === EntityViewTab.Audit && (
        <EntityAudit entity={selectedToolset} view={ApplicationRoute.AssetsToolsets} />
      )}
    </>
  );
};

export default TabsContent;
