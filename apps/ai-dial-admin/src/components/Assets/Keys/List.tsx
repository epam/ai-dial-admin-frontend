'use client';

import { FC } from 'react';

import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const KeysList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.AssetsKeys} />;
};

export default KeysList;
