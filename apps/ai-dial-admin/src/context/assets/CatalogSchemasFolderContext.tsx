'use client';

import { getCatalogSchemas } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { Asset } from '@/src/models/dial/deployment-asset';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: CatalogSchemasFolderProvider, useFolderContext: useCatalogSchemasFolder } =
  createFolderContext(
    getCatalogSchemas as (path: string) => Promise<Asset[] | null | undefined>,
    'useCatalogSchemasFolder',
  );
