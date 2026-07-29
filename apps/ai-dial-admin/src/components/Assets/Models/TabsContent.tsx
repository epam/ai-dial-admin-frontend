'use client';

import { FC } from 'react';

import { AssetModel } from '@/src/models/dial/deployment-asset';
import { DialModelResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ModelResourceFeatures from './Features';
import ModelAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedModel: AssetModel;
  onChange: (model: AssetModel) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedModel, onChange }) => {
  const onChangeResource = (model: DialModelResource) => {
    onChange({ ...selectedModel, ...model } as AssetModel);
  };

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <ModelAssetProperties asset={selectedModel as unknown as DialModelResource} onChange={onChangeResource} />
      )}

      {activeTab === EntityViewTab.Features && (
        <ModelResourceFeatures
          entity={selectedModel as unknown as DialModelResource}
          onChangeEntity={onChangeResource}
        />
      )}
    </>
  );
};

export default TabsContent;
