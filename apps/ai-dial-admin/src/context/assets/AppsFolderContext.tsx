'use client';

import { getApps } from '@/src/app/[lang]/assets-applications/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { getFileFolderRows } from '@/src/context/assets/file-folders';
import { MovableAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: AppsFolderProvider, useFolderContext: useAppsFolder } =
  createFolderContext<MovableAssetListItem>(getApps, 'useAppsFolder', getFileFolderRows);
