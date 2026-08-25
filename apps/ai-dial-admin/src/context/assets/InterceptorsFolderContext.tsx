'use client';

import { getInterceptors } from '@/src/app/[lang]/assets-interceptors/actions';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: InterceptorsFolderProvider, useFolderContext: useInterceptorsFolder } = createFolderContext(
  getInterceptors as (path: string) => Promise<DialInterceptorResource[] | null | undefined>,
  'useInterceptorsFolder',
);
