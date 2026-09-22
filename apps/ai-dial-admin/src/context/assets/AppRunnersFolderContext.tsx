'use client';

import { getRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import { Asset } from '@/src/models/dial/deployment-asset';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: AppRunnersFolderProvider, useFolderContext: useAppRunnersFolder } = createFolderContext(
  getRunners as (path: string) => Promise<Asset[] | null | undefined>,
  'useAppRunnersFolder',
);
