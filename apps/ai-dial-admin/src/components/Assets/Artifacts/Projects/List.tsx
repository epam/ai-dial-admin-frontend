'use client';

import { FC } from 'react';

import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const ProjectsList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.Projects} />;
};

export default ProjectsList;
