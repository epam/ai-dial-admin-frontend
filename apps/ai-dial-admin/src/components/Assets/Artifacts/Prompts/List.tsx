'use client';

import { FC } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';

const PromptsList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.Prompts} />;
};

export default PromptsList;
