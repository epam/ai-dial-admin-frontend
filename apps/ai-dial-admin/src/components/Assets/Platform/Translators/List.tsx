'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import type { PluginOptions } from '@/src/server/config-entities/read-plugin-options';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  plugins?: PluginOptions;
}

const TranslatorsList: FC<Props> = ({ plugins }) => {
  return <TabbedAssetList view={ApplicationRoute.PlatformTranslators} plugins={plugins} />;
};

export default TranslatorsList;
