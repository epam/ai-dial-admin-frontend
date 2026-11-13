'use client';

import { getCatalogSchemas } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: CatalogSchemasFolderProvider, useFolderContext: useCatalogSchemasFolder } =
  createFolderContext<PlatformAssetListItem>(getCatalogSchemas, 'useCatalogSchemasFolder');
