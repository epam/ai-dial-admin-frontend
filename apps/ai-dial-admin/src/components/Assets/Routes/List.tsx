'use client';

import { FC } from 'react';

import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const RoutesList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.AssetsRoutes} />;
};

export default RoutesList;
