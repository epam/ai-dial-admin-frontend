'use client';

import { getKeys } from '@/src/app/[lang]/platform-keys/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: KeysFolderProvider, useFolderContext: useKeysFolder } =
  createFolderContext<PlatformAssetListItem>(getKeys, 'useKeysFolder');
