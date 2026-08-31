'use client';

import { getKeys } from '@/src/app/[lang]/platform-keys/actions';
import { DialKeyResource } from '@/src/models/dial/resource';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: KeysFolderProvider, useFolderContext: useKeysFolder } = createFolderContext(
  getKeys as (path: string) => Promise<DialKeyResource[] | null | undefined>,
  'useKeysFolder',
);
