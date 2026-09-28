'use client';

import { getConfigFileRoutes, getRoutes } from '@/src/app/[lang]/platform-routes/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: RoutesFolderProvider, useFolderContext: useRoutesFolder } =
  createFolderContext<PlatformAssetListItem>(getRoutes, 'useRoutesFolder', async () => {
    const result = await getConfigFileRoutes();
    return result.success ? result.data : undefined;
  });
