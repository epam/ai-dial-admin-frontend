'use client';

import { FC } from 'react';

import { getConfigFileInterceptors } from '@/src/app/[lang]/platform-interceptors/actions';
import ConfigFileEntityList from '@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import { ApplicationRoute } from '@/src/types/routes';
import AssetInterceptorsList from './List';

/**
 * What `platform-interceptors/page.tsx` renders: the existing asset browser by default, swapped for
 * the config-file-backed, names-only list when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const PlatformInterceptorsPageList: FC = () => (
  <ConfigFileListSwap
    assetList={<AssetInterceptorsList />}
    fetchConfigFileList={getConfigFileInterceptors}
    renderConfigFileList={(names) => (
      <ConfigFileEntityList
        names={names}
        route={ApplicationRoute.PlatformInterceptors}
        headerExtra={<ConfigFilesToggle />}
      />
    )}
  />
);

export default PlatformInterceptorsPageList;
