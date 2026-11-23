'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const RolesList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformRoles} />;
};

export default RolesList;
