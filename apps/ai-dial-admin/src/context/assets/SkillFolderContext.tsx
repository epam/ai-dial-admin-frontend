'use client';

import { getSkills } from '@/src/app/[lang]/skills/actions';
import { Asset } from '@/src/models/dial/deployment-asset';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: SkillFolderProvider, useFolderContext: useSkillFolder } = createFolderContext(
  getSkills as (path: string) => Promise<Asset[] | null | undefined>,
  'useSkillFolder',
);
