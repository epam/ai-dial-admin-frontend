'use client';

import { FC } from 'react';

import { getConfigFileRoles } from '@/src/app/[lang]/platform-roles/actions';
import ConfigFileEntityList from '@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import { ApplicationRoute } from '@/src/types/routes';
import AssetRolesList from './List';

/**
 * What `platform-roles/page.tsx` renders: the existing asset browser by default, swapped for the
 * config-file-backed, names-only list when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const PlatformRolesPageList: FC = () => (
  <ConfigFileListSwap
    assetList={<AssetRolesList />}
    fetchConfigFileList={getConfigFileRoles}
    renderConfigFileList={(names) => (
      <ConfigFileEntityList names={names} route={ApplicationRoute.PlatformRoles} headerExtra={<ConfigFilesToggle />} />
    )}
  />
);

export default PlatformRolesPageList;
