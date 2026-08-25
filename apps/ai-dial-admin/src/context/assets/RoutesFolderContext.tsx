'use client';

import { getRoutes } from '@/src/app/[lang]/assets-routes/actions';
import { DialRouteResource } from '@/src/models/dial/resource';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: RoutesFolderProvider, useFolderContext: useRoutesFolder } = createFolderContext(
  getRoutes as (path: string) => Promise<DialRouteResource[] | null | undefined>,
  'useRoutesFolder',
);
