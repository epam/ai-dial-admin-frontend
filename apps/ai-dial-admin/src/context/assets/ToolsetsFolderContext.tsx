'use client';

import { getToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: ToolsetFolderProvider, useFolderContext: useToolsetFolder } = createFolderContext(
  getToolsets as (path: string) => Promise<AssetToolset[] | null | undefined>,
  'useToolsetFolder',
);
