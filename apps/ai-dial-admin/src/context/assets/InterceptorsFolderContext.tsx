'use client';

import { getInterceptors } from '@/src/app/[lang]/platform-interceptors/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: InterceptorsFolderProvider, useFolderContext: useInterceptorsFolder } =
  createFolderContext<PlatformAssetListItem>(getInterceptors, 'useInterceptorsFolder');
