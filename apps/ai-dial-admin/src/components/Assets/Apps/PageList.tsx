'use client';

import { FC } from 'react';

import { getConfigFileApplications } from '@/src/app/[lang]/assets-applications/actions';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import AdminApplicationsList from '@/src/components/Applications/List/List';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import AssetAppsList from './List';

interface Props {
  runners: DialApplicationScheme[];
}

/**
 * What `assets-applications/page.tsx` renders: the existing asset browser by default, swapped for
 * the config-file-backed admin grid when `showConfigFiles` is on — see `config-file-entity-views`.
 * App Runners have no config-file population (out of scope), so the admin grid's own runners column
 * gets an empty list in that mode rather than the asset browser's admin/asset runner union.
 */
const AssetsApplicationsPageList: FC<Props> = ({ runners }) => (
  <ConfigFileListSwap<DialApplication>
    assetList={<AssetAppsList runners={runners} />}
    fetchConfigFileList={getConfigFileApplications}
    renderConfigFileList={(data) => (
      <AdminApplicationsList data={data} runners={[]} isConfigFileSource headerExtra={<ConfigFilesToggle />} />
    )}
  />
);

export default AssetsApplicationsPageList;
