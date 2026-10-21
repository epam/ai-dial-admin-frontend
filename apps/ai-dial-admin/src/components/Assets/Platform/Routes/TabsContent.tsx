'use client';

import { FC } from 'react';

import AssetRoles from '@/src/components/EntityView/Roles/AssetRoles';
import { DialRole } from '@/src/models/dial/role';
import { DialRouteResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import RouteAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedRoute: DialRouteResource;
  originalRoute: DialRouteResource;
  roles: DialRole[];
  onChange: (route: DialRouteResource) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedRoute, originalRoute, roles, onChange }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <RouteAssetProperties asset={selectedRoute} originalAsset={originalRoute} onChange={onChange} />
      )}

      {activeTab === EntityViewTab.Roles && (
        <AssetRoles view={ApplicationRoute.PlatformRoutes} asset={selectedRoute} roles={roles} onChange={onChange} />
      )}
    </>
  );
};

export default TabsContent;
