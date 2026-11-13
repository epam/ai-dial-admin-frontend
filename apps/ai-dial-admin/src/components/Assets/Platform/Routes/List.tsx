'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const RoutesList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformRoutes} />;
};

export default RoutesList;
