'use client';

import { getTranslators } from '@/src/app/[lang]/platform-translators/actions';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: TranslatorsFolderProvider, useFolderContext: useTranslatorsFolder } = createFolderContext(
  getTranslators as (path: string) => Promise<DialTranslatorResource[] | null | undefined>,
  'useTranslatorsFolder',
);
