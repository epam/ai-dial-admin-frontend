'use client';

import { getConfigFileRoles, getRoles } from '@/src/app/[lang]/platform-roles/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: RolesFolderProvider, useFolderContext: useRolesFolder } =
  createFolderContext<PlatformAssetListItem>(getRoles, 'useRolesFolder', async () => {
    const result = await getConfigFileRoles();
    return result.success ? result.data : undefined;
  });
