'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const InterceptorsList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformInterceptors} />;
};

export default InterceptorsList;
