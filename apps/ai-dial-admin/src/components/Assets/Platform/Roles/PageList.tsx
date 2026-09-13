'use client';

import { FC } from 'react';

import { getConfigFileRoles } from '@/src/app/[lang]/platform-roles/actions';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import AdminRolesList from '@/src/components/Roles/List/List';
import { DialRole } from '@/src/models/dial/role';
import AssetRolesList from './List';

/**
 * What `platform-roles/page.tsx` renders: the existing asset browser by default, swapped for the
 * config-file-backed admin grid when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const PlatformRolesPageList: FC = () => (
  <ConfigFileListSwap<DialRole>
    assetList={<AssetRolesList />}
    fetchConfigFileList={getConfigFileRoles}
    renderConfigFileList={(data) => (
      <AdminRolesList data={data} isConfigFileSource headerExtra={<ConfigFilesToggle />} />
    )}
  />
);

export default PlatformRolesPageList;
