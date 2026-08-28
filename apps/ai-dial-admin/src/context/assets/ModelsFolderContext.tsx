'use client';

import { getModels } from '@/src/app/[lang]/platform-models/actions';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: ModelsFolderProvider, useFolderContext: useModelsFolder } = createFolderContext(
  getModels as (path: string) => Promise<AssetModel[] | null | undefined>,
  'useModelsFolder',
);
