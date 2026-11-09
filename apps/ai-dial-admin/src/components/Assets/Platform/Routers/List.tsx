'use client';

import { FC } from 'react';

import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const RoutersList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.PlatformRouters} />;
};

export default RoutersList;
