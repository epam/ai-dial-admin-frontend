'use client';

import { getKeys } from '@/src/app/[lang]/platform-keys/actions';
import { Asset } from '@/src/models/dial/deployment-asset';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: KeysFolderProvider, useFolderContext: useKeysFolder } = createFolderContext(
  getKeys as (path: string) => Promise<Asset[] | null | undefined>,
  'useKeysFolder',
);
