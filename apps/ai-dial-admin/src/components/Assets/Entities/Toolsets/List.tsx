'use client';

import { FC } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';

const ToolsetsList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.AssetsToolsets} />;
};

export default ToolsetsList;
