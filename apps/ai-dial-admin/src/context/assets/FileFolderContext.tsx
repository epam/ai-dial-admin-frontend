'use client';

import { getFiles } from '@/src/app/[lang]/files/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { MovableAssetListItem } from '@/src/models/dial/asset-list-item';

/**
 * `getFiles` is declared `Promise<DialFile[]>`, and `DialFile.name`/`bucket` are typed optional
 * because `DialFile` doubles as a detail DTO (see `DialFile.folderId`'s own comment for the same
 * doubling). Every row `toFileList` actually produces carries both — Core's file metadata always
 * reports them — so the cast states a genuine runtime guarantee the type alone can't express.
 */
export const { Provider: FileFolderProvider, useFolderContext: useFileFolder } = createFolderContext(
  getFiles as (path: string) => Promise<MovableAssetListItem[] | null | undefined>,
  'useFileFolder',
);
