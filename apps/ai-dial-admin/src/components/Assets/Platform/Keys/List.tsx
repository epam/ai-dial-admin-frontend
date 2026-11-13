'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const KeysList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformKeys} />;
};

export default KeysList;
