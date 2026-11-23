'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const PoliciesList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformPolicies} />;
};

export default PoliciesList;
