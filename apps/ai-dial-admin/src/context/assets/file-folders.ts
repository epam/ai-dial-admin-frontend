'use client';

import { getFileFolders } from '@/src/app/[lang]/files/actions';
import { AssetListItem } from '@/src/models/dial/asset-list-item';

/**
 * `getFileFolders` returns `DialFile` rows, whose `name`/`bucket`/`folderId` are optional because
 * `DialFile` doubles as a detail DTO. Every folder row `toFileList` produces carries them (Core's file
 * metadata always reports them), so the cast states a runtime guarantee the type alone can't express.
 */
export const getFileFolderRows = getFileFolders as <T extends AssetListItem>(path: string) => Promise<T[]>;
