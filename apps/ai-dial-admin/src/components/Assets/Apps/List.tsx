'use client';

import { FC } from 'react';

import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';

interface Props {
  runners: DialApplicationScheme[];
}

const AppsList: FC<Props> = ({ runners }) => {
  return <BaseAssetList view={ApplicationRoute.AssetsApplications} runners={runners} />;
};

export default AppsList;
