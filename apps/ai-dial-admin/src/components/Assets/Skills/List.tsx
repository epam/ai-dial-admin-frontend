'use client';

import { FC } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';

const SkillsList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.AssetsSkills} />;
};

export default SkillsList;
