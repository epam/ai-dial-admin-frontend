'use client';

import { getRouters } from '@/src/app/[lang]/platform-routers/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: RoutersFolderProvider, useFolderContext: useRoutersFolder } =
  createFolderContext<PlatformAssetListItem>(getRouters, 'useRoutersFolder');
