'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const AppRunnersList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformAppRunners} />;
};

export default AppRunnersList;
