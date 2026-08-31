'use client';

import { FC } from 'react';

import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const InterceptorsList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.PlatformInterceptors} />;
};

export default InterceptorsList;
