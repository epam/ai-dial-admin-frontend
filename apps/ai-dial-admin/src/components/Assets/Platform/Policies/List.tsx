'use client';

import { FC } from 'react';

import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const PoliciesList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.PlatformPolicies} />;
};

export default PoliciesList;
