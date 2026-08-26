'use client';

import { FC } from 'react';

import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const RolesList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.AssetsRoles} />;
};

export default RolesList;
