'use client';

import { getPrompts } from '@/src/app/[lang]/prompts/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { MovableAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: PromptFolderProvider, useFolderContext: usePromptFolder } =
  createFolderContext<MovableAssetListItem>(getPrompts, 'usePromptFolder');
