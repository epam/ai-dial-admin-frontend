'use client';

import { createFolderContext } from './AssetsFolderContext';
import { getToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import { AssetToolset } from '@/src/models/dial/deployment-asset';

export const { Provider: ToolsetFolderProvider, useFolderContext: useToolsetFolder } = createFolderContext(
  getToolsets as (path: string) => Promise<AssetToolset[] | null | undefined>,
  'useToolsetFolder',
);
