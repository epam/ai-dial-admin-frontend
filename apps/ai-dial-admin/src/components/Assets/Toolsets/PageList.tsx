'use client';

import { FC } from 'react';

import { getConfigFileToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import AdminToolsetsList from '@/src/components/Toolsets/List';
import { Toolset } from '@/src/models/dial/toolset';
import AssetToolsetsList from './List';

/**
 * What `assets-toolsets/page.tsx` renders: the existing asset browser by default, swapped for the
 * config-file-backed admin grid when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const AssetsToolsetsPageList: FC = () => (
  <ConfigFileListSwap<Toolset>
    assetList={<AssetToolsetsList />}
    fetchConfigFileList={getConfigFileToolsets}
    renderConfigFileList={(data) => (
      <AdminToolsetsList data={data} isConfigFileSource headerExtra={<ConfigFilesToggle />} />
    )}
  />
);

export default AssetsToolsetsPageList;
