'use client';

import { getFiles } from '@/src/app/[lang]/files/actions';
import { createFolderContext } from './AssetsFolderContext';

export const { Provider: FileFolderProvider, useFolderContext: useFileFolder } = createFolderContext(
  getFiles,
  'useFileFolder',
);
