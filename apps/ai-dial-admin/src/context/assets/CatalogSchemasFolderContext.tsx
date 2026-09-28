'use client';

import { getCatalogSchemas, getConfigFileCatalogSchemas } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: CatalogSchemasFolderProvider, useFolderContext: useCatalogSchemasFolder } =
  createFolderContext<PlatformAssetListItem>(getCatalogSchemas, 'useCatalogSchemasFolder', async () => {
    const result = await getConfigFileCatalogSchemas();
    return result.success ? result.data : undefined;
  });
