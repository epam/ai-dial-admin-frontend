'use client';

import { createFolderContext } from './AssetsFolderContext';
import { getFiles } from '@/src/app/[lang]/files/actions';
import { DialFile } from '@/src/models/dial/file';

export const { Provider: FileFolderProvider, useFolderContext: useFileFolder } = createFolderContext<DialFile>(
  getFiles,
  'useFileFolder',
);
