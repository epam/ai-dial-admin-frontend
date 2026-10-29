'use client';

import { getProjects } from '@/src/app/[lang]/projects/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { MovableAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: ProjectFolderProvider, useFolderContext: useProjectFolder } =
  createFolderContext<MovableAssetListItem>(getProjects, 'useProjectFolder');
