'use client';

import { getFiles } from '@/src/app/[lang]/files/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: FileFolderProvider, useFolderContext: useFileFolder } = createFolderContext(
  getFiles,
  'useFileFolder',
);
