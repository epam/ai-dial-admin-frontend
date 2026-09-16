'use client';

import { FC } from 'react';

import { getConfigFileRoutes } from '@/src/app/[lang]/platform-routes/actions';
import ConfigFileEntityList from '@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import { ApplicationRoute } from '@/src/types/routes';
import AssetRoutesList from './List';

/**
 * What `platform-routes/page.tsx` renders: the existing asset browser by default, swapped for the
 * config-file-backed, names-only list when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const PlatformRoutesPageList: FC = () => (
  <ConfigFileListSwap
    assetList={<AssetRoutesList />}
    fetchConfigFileList={getConfigFileRoutes}
    renderConfigFileList={(names) => (
      <ConfigFileEntityList names={names} route={ApplicationRoute.PlatformRoutes} headerExtra={<ConfigFilesToggle />} />
    )}
  />
);

export default PlatformRoutesPageList;
