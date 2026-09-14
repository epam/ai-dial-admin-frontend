'use client';

import { FC } from 'react';

import { getConfigFileToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import ConfigFileEntityList from '@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import { ApplicationRoute } from '@/src/types/routes';
import AssetToolsetsList from './List';

/**
 * What `assets-toolsets/page.tsx` renders: the existing asset browser by default, swapped for the
 * config-file-backed, names-only list when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const AssetsToolsetsPageList: FC = () => (
  <ConfigFileListSwap
    assetList={<AssetToolsetsList />}
    fetchConfigFileList={getConfigFileToolsets}
    renderConfigFileList={(names) => (
      <ConfigFileEntityList
        names={names}
        route={ApplicationRoute.AssetsToolsets}
        headerExtra={<ConfigFilesToggle />}
      />
    )}
  />
);

export default AssetsToolsetsPageList;
