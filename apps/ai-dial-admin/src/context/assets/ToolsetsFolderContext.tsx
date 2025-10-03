'use client';

import { getApps } from '@/src/app/[lang]/assets-applications/actions';
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { createFolderContext } from './AssetsFolderContext';

export const { Provider: ToolsetFolderProvider, useFolderContext: useToolsetFolder } =
  createFolderContext<DialAssetApp>(
    getApps as (path: string) => Promise<DialAssetApp[] | null | undefined>,
    'useToolsetFolder',
  );
