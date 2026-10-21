'use client';

import { getConfigFileTranslators, getTranslators } from '@/src/app/[lang]/platform-translators/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: TranslatorsFolderProvider, useFolderContext: useTranslatorsFolder } =
  createFolderContext<PlatformAssetListItem>(getTranslators, 'useTranslatorsFolder', async () => {
    const result = await getConfigFileTranslators();
    return result.success ? result.data : undefined;
  });
