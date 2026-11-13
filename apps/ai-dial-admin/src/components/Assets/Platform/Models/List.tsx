'use client';

import { FC } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';

const ModelsList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformModels} />;
};

export default ModelsList;
