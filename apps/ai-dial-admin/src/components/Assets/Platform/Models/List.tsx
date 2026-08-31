'use client';

import { FC } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';

const ModelsList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.PlatformModels} />;
};

export default ModelsList;
