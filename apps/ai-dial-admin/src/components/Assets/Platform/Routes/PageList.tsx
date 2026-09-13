'use client';

import { FC } from 'react';

import { getConfigFileRoutes } from '@/src/app/[lang]/platform-routes/actions';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import AdminRoutesList from '@/src/components/Routes/List/RoutesList';
import { DialRoute } from '@/src/models/dial/route';
import AssetRoutesList from './List';

/**
 * What `platform-routes/page.tsx` renders: the existing asset browser by default, swapped for the
 * config-file-backed admin grid when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const PlatformRoutesPageList: FC = () => (
  <ConfigFileListSwap<DialRoute>
    assetList={<AssetRoutesList />}
    fetchConfigFileList={getConfigFileRoutes}
    renderConfigFileList={(data) => (
      <AdminRoutesList data={data} isConfigFileSource headerExtra={<ConfigFilesToggle />} />
    )}
  />
);

export default PlatformRoutesPageList;
