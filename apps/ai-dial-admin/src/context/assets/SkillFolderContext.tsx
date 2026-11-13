'use client';

import { getSkills } from '@/src/app/[lang]/skills/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { getFileFolderRows } from '@/src/context/assets/file-folders';
import { MovableAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: SkillFolderProvider, useFolderContext: useSkillFolder } =
  createFolderContext<MovableAssetListItem>(getSkills, 'useSkillFolder', getFileFolderRows);
