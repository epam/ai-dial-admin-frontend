'use client';

import { getFiles } from '@/src/app/[lang]/files/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { Asset } from '@/src/models/dial/deployment-asset';

export const { Provider: FileFolderProvider, useFolderContext: useFileFolder } = createFolderContext(
  getFiles as (path: string) => Promise<Asset[] | null | undefined>,
  'useFileFolder',
);
