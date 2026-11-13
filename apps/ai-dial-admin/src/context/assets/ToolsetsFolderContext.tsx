'use client';

import { getToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { getFileFolderRows } from '@/src/context/assets/file-folders';
import { MovableAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: ToolsetFolderProvider, useFolderContext: useToolsetFolder } =
  createFolderContext<MovableAssetListItem>(getToolsets, 'useToolsetFolder', getFileFolderRows);
