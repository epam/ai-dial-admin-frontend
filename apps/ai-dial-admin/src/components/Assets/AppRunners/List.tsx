'use client';

import { FC } from 'react';

import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const AppRunnersList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.AssetsAppRunners} />;
};

export default AppRunnersList;
