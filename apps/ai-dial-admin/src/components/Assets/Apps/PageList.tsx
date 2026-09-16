'use client';

import { FC } from 'react';

import { getConfigFileApplications } from '@/src/app/[lang]/assets-applications/actions';
import ConfigFileEntityList from '@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import AssetAppsList from './List';

interface Props {
  runners: DialApplicationScheme[];
}

/**
 * What `assets-applications/page.tsx` renders: the existing asset browser by default, swapped for
 * the config-file-backed, names-only list when `showConfigFiles` is on — see `config-file-entity-views`.
 */
const AssetsApplicationsPageList: FC<Props> = ({ runners }) => (
  <ConfigFileListSwap
    assetList={<AssetAppsList runners={runners} />}
    fetchConfigFileList={getConfigFileApplications}
    renderConfigFileList={(names) => (
      <ConfigFileEntityList
        names={names}
        route={ApplicationRoute.AssetsApplications}
        headerExtra={<ConfigFilesToggle />}
      />
    )}
  />
);

export default AssetsApplicationsPageList;
