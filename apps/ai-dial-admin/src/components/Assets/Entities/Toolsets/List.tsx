'use client';

import { FC } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';

interface Props {
  isUnsafeImportEnabled?: boolean;
}

const ToolsetsList: FC<Props> = ({ isUnsafeImportEnabled }) => {
  return <TabbedAssetList view={ApplicationRoute.AssetsToolsets} isUnsafeImportEnabled={isUnsafeImportEnabled} />;
};

export default ToolsetsList;
