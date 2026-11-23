'use client';

import { FC } from 'react';

import { DialApplicationScheme } from '@/src/models/dial/application';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';

interface Props {
  runners: DialApplicationScheme[];
  translators?: ResourceInfo[];
}

const AppsList: FC<Props> = ({ runners, translators }) => {
  return <TabbedAssetList view={ApplicationRoute.AssetsApplications} runners={runners} translators={translators} />;
};

export default AppsList;
