'use client';

import { getTranslators } from '@/src/app/[lang]/platform-translators/actions';
import { Asset } from '@/src/models/dial/deployment-asset';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: TranslatorsFolderProvider, useFolderContext: useTranslatorsFolder } = createFolderContext(
  getTranslators as (path: string) => Promise<Asset[] | null | undefined>,
  'useTranslatorsFolder',
);
