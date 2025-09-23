'use client';

import { getApps } from '@/src/app/[lang]/assets-applications/actions';
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { createFolderContext } from './AssetsFolderContext';

export const { Provider: AppsFolderProvider, useFolderContext: useAppsFolder } = createFolderContext<DialAssetApp>(
  getApps,
  'useAppsFolder',
);
