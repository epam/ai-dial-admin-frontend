'use client';

import { getConfigFileAppRunners, getRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: AppRunnersFolderProvider, useFolderContext: useAppRunnersFolder } =
  createFolderContext<PlatformAssetListItem>(getRunners, 'useAppRunnersFolder', async () => {
    const result = await getConfigFileAppRunners();
    return result.success ? result.data : undefined;
  });
