'use client';

import { FC } from 'react';

import TabbedAssetList from '@/src/components/Assets/TabbedAssetList/TabbedAssetList';
import { ApplicationRoute } from '@/src/types/routes';

const CatalogSchemasList: FC = () => {
  return <TabbedAssetList view={ApplicationRoute.PlatformCatalogSchemas} />;
};

export default CatalogSchemasList;
