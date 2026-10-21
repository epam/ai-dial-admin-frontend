'use client';

import { FC } from 'react';

import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const TranslatorsList: FC = () => {
  return <BaseAssetList view={ApplicationRoute.PlatformTranslators} />;
};

export default TranslatorsList;
