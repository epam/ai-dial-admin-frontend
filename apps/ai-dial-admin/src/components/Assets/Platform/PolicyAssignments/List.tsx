'use client';

import { FC } from 'react';

import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const PolicyAssignmentsList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.PlatformPolicyAssignments} />;
};

export default PolicyAssignmentsList;
