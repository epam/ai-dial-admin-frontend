'use client';

import { getCatalogSchemas } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: CatalogSchemasFolderProvider, useFolderContext: useCatalogSchemasFolder } =
  createFolderContext(
    getCatalogSchemas as (path: string) => Promise<DialCatalogSchemaResource[] | null | undefined>,
    'useCatalogSchemasFolder',
  );
