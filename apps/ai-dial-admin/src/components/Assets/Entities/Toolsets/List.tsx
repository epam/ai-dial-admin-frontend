'use client';

import { FC } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';

interface Props {
  isUnsafeImportEnabled?: boolean;
}

const ToolsetsList: FC<Props> = ({ isUnsafeImportEnabled }) => {
  return <BaseAssetList view={ApplicationRoute.AssetsToolsets} isUnsafeImportEnabled={isUnsafeImportEnabled} />;
};

export default ToolsetsList;
