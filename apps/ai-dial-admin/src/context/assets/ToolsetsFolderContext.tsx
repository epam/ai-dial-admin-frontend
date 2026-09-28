'use client';

import { getConfigFileToolsets, getToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { MovableAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: ToolsetFolderProvider, useFolderContext: useToolsetFolder } =
  createFolderContext<MovableAssetListItem>(getToolsets, 'useToolsetFolder', async () => {
    const result = await getConfigFileToolsets();
    return result.success ? result.data : undefined;
  });
