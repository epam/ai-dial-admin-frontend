'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const PluginsList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformPlugins} />;
};

export default PluginsList;
