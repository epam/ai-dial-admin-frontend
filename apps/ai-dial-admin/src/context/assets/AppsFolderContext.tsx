'use client';

import { getApps } from '@/src/app/[lang]/assets-applications/actions';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { createFolderContext } from './AssetsFolderContext';

export const { Provider: AppsFolderProvider, useFolderContext: useAppsFolder } = createFolderContext(
  getApps as (path: string) => Promise<AssetApp[] | null | undefined>,
  'useAppsFolder',
);
