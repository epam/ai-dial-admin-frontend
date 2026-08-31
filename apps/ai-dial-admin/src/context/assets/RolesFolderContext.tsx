'use client';

import { getRoles } from '@/src/app/[lang]/platform-roles/actions';
import { DialRoleResource } from '@/src/models/dial/resource';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';

export const { Provider: RolesFolderProvider, useFolderContext: useRolesFolder } = createFolderContext(
  getRoles as (path: string) => Promise<DialRoleResource[] | null | undefined>,
  'useRolesFolder',
);
