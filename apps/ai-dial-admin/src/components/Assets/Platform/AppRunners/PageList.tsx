'use client';

import { FC } from 'react';

import { getConfigFileAppRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import ConfigFileEntityList from '@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import { ApplicationRoute } from '@/src/types/routes';
import AssetAppRunnersList from './List';

/**
 * What `platform-app-runners/page.tsx` renders: the existing asset browser by default, swapped for
 * the config-file-backed, names-only list when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const PlatformAppRunnersPageList: FC = () => (
  <ConfigFileListSwap
    assetList={<AssetAppRunnersList />}
    fetchConfigFileList={getConfigFileAppRunners}
    renderConfigFileList={(names) => (
      <ConfigFileEntityList
        names={names}
        route={ApplicationRoute.PlatformAppRunners}
        headerExtra={<ConfigFilesToggle />}
      />
    )}
  />
);

export default PlatformAppRunnersPageList;
