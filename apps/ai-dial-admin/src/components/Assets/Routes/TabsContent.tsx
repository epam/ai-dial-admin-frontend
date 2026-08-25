'use client';

import { FC } from 'react';

import { DialRouteResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import RouteAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedRoute: DialRouteResource;
  originalRoute: DialRouteResource;
  onChange: (route: DialRouteResource) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedRoute, originalRoute, onChange }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <RouteAssetProperties asset={selectedRoute} originalAsset={originalRoute} onChange={onChange} />
      )}
    </>
  );
};

export default TabsContent;
