'use client';

import { getRoutes } from '@/src/app/[lang]/platform-routes/actions';
import { Asset } from '@/src/models/dial/deployment-asset';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: RoutesFolderProvider, useFolderContext: useRoutesFolder } = createFolderContext(
  getRoutes as (path: string) => Promise<Asset[] | null | undefined>,
  'useRoutesFolder',
);
