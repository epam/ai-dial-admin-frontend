'use client';

import { FC } from 'react';

import { DialApplicationScheme } from '@/src/models/dial/application';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';

interface Props {
  runners: DialApplicationScheme[];
  translators?: ResourceInfo[];
}

const AppsList: FC<Props> = ({ runners, translators }) => {
  return <BaseAssetList view={ApplicationRoute.AssetsApplications} runners={runners} translators={translators} />;
};

export default AppsList;
