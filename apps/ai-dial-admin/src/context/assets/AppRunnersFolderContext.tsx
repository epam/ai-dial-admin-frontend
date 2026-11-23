'use client';

import { getRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: AppRunnersFolderProvider, useFolderContext: useAppRunnersFolder } =
  createFolderContext<PlatformAssetListItem>(getRunners, 'useAppRunnersFolder');
