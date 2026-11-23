'use client';

import { getAliases } from '@/src/app/[lang]/assets-aliases/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: AliasesFolderProvider, useFolderContext: useAliasesFolder } =
  createFolderContext<PlatformAssetListItem>(getAliases, 'useAliasesFolder');
