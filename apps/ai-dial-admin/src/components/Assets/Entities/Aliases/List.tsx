'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const AliasesList: FC = () => <TabbedAssetList view={ApplicationRoute.AssetsAliases} />;

export default AliasesList;
