'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const RoutersList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformRouters} />;
};

export default RoutersList;
