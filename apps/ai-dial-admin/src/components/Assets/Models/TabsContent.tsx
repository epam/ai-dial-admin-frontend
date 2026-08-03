'use client';

import { FC } from 'react';

import EntityInterceptors from '@/src/components/EntityView/Interceptors/Interceptors';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { DialModelResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ModelResourceFeatures from './Features';
import InvalidModelBanner from './InvalidModelBanner';
import ModelAssetProperties from './Properties';
import ModelAssetRoles from './Roles';
import UpstreamSecretWarning from './UpstreamSecretWarning';

interface Props {
  activeTab: EntityViewTab;
  selectedModel: AssetModel;
  originalModel: AssetModel;
  roles: DialRole[];
  interceptors: DialInterceptor[];
  onChange: (model: AssetModel) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedModel, originalModel, roles, interceptors, onChange }) => {
  const resource = selectedModel as unknown as DialModelResource;

  // Passed through whole, deliberately not merged over `selectedModel`. Every control here returns a
  // full copy, and a merge re-adds any key a control removed — which silently defeated clearing a
  // field whose empty value must reach Core as absent rather than `''`.
  const onChangeResource = (model: DialModelResource) => {
    onChange(model as unknown as AssetModel);
  };

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <>
          <InvalidModelBanner asset={resource} />
          <UpstreamSecretWarning
            originalUpstreams={originalModel.upstreams}
            editedUpstreams={selectedModel.upstreams}
          />
          <ModelAssetProperties asset={resource} onChange={onChangeResource} />
        </>
      )}

      {activeTab === EntityViewTab.Features && (
        <ModelResourceFeatures entity={resource} onChangeEntity={onChangeResource} />
      )}

      {activeTab === EntityViewTab.Roles && (
        <ModelAssetRoles asset={resource} roles={roles} onChange={onChangeResource} />
      )}

      {activeTab === EntityViewTab.Interceptors && (
        <EntityInterceptors
          entity={selectedModel}
          interceptors={interceptors}
          onChangeEntity={onChange}
          view={ApplicationRoute.AssetsModels}
        />
      )}
    </>
  );
};

export default TabsContent;
