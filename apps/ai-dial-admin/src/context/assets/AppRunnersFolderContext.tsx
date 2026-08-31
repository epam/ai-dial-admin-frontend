'use client';

import { getRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: AppRunnersFolderProvider, useFolderContext: useAppRunnersFolder } = createFolderContext(
  getRunners as (path: string) => Promise<DialAppRunnerResource[] | null | undefined>,
  'useAppRunnersFolder',
);
