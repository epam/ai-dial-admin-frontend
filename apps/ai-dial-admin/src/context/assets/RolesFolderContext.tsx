'use client';

import { getRoles } from '@/src/app/[lang]/platform-roles/actions';
import { Asset } from '@/src/models/dial/deployment-asset';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: RolesFolderProvider, useFolderContext: useRolesFolder } = createFolderContext(
  getRoles as (path: string) => Promise<Asset[] | null | undefined>,
  'useRolesFolder',
);
