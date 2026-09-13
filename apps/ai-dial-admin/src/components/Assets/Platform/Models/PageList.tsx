'use client';

import { FC } from 'react';

import { getConfigFileModels } from '@/src/app/[lang]/platform-models/actions';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import AdminModelsList from '@/src/components/Models/List/List';
import { DialModel } from '@/src/models/dial/model';
import AssetModelsList from './List';

/**
 * What `platform-models/page.tsx` renders: the existing asset browser by default, swapped for the
 * config-file-backed admin grid when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const PlatformModelsPageList: FC = () => (
  <ConfigFileListSwap<DialModel>
    assetList={<AssetModelsList />}
    fetchConfigFileList={getConfigFileModels}
    renderConfigFileList={(data) => (
      <AdminModelsList data={data} isConfigFileSource headerExtra={<ConfigFilesToggle />} />
    )}
  />
);

export default PlatformModelsPageList;
