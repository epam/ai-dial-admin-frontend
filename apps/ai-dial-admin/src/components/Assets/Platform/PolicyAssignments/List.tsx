'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const PolicyAssignmentsList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformPolicyAssignments} />;
};

export default PolicyAssignmentsList;
