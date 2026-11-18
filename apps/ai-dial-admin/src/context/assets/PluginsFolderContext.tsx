'use client';

import { getPlugins } from '@/src/app/[lang]/platform-plugins/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: PluginsFolderProvider, useFolderContext: usePluginsFolder } =
  createFolderContext<PlatformAssetListItem>(getPlugins, 'usePluginsFolder');
