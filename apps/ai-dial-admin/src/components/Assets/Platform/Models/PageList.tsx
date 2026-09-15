'use client';

import { FC } from 'react';

import { getConfigFileModels } from '@/src/app/[lang]/platform-models/actions';
import ConfigFileEntityList from '@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import { ApplicationRoute } from '@/src/types/routes';
import AssetModelsList from './List';

/**
 * What `platform-models/page.tsx` renders: the existing asset browser by default, swapped for the
 * config-file-backed, names-only list when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const PlatformModelsPageList: FC = () => (
  <ConfigFileListSwap
    assetList={<AssetModelsList />}
    fetchConfigFileList={getConfigFileModels}
    renderConfigFileList={(names) => (
      <ConfigFileEntityList names={names} route={ApplicationRoute.PlatformModels} headerExtra={<ConfigFilesToggle />} />
    )}
  />
);

export default PlatformModelsPageList;
