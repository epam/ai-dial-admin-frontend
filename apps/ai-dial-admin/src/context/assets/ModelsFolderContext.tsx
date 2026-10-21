'use client';

import { getConfigFileModels, getModels } from '@/src/app/[lang]/platform-models/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: ModelsFolderProvider, useFolderContext: useModelsFolder } =
  createFolderContext<PlatformAssetListItem>(getModels, 'useModelsFolder', async () => {
    const result = await getConfigFileModels();
    return result.success ? result.data : undefined;
  });
