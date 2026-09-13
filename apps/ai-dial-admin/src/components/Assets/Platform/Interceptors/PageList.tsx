'use client';

import { FC } from 'react';

import { getConfigFileInterceptors } from '@/src/app/[lang]/platform-interceptors/actions';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import AdminInterceptorsList from '@/src/components/Interceptors/List/List';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import AssetInterceptorsList from './List';

/**
 * What `platform-interceptors/page.tsx` renders: the existing asset browser by default, swapped for
 * the config-file-backed admin grid when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const PlatformInterceptorsPageList: FC = () => (
  <ConfigFileListSwap<DialInterceptor>
    assetList={<AssetInterceptorsList />}
    fetchConfigFileList={getConfigFileInterceptors}
    renderConfigFileList={(data) => (
      <AdminInterceptorsList data={data} isConfigFileSource headerExtra={<ConfigFilesToggle />} />
    )}
  />
);

export default PlatformInterceptorsPageList;
