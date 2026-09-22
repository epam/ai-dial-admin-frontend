'use client';

import { getInterceptors } from '@/src/app/[lang]/platform-interceptors/actions';
import { Asset } from '@/src/models/dial/deployment-asset';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: InterceptorsFolderProvider, useFolderContext: useInterceptorsFolder } = createFolderContext(
  getInterceptors as (path: string) => Promise<Asset[] | null | undefined>,
  'useInterceptorsFolder',
);
