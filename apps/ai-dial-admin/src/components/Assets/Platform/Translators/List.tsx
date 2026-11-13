'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const TranslatorsList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformTranslators} />;
};

export default TranslatorsList;
