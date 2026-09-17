'use client';

import { FC } from 'react';

import { getConfigFileCatalogSchemas } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import ConfigFileEntityList from '@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList';
import ConfigFileListSwap from '@/src/components/Common/ConfigFileListSwap/ConfigFileListSwap';
import ConfigFilesToggle from '@/src/components/Common/ConfigFilesToggle/ConfigFilesToggle';
import { ApplicationRoute } from '@/src/types/routes';
import CatalogSchemasList from './List';

/**
 * What `platform-catalog-schemas/page.tsx` renders: the existing asset browser by default, swapped
 * for the config-file-backed, names-only list when `showConfigFiles` is on — see
 * `config-file-entity-views`.
 */
const PlatformCatalogSchemasPageList: FC = () => (
  <ConfigFileListSwap
    assetList={<CatalogSchemasList />}
    fetchConfigFileList={getConfigFileCatalogSchemas}
    renderConfigFileList={(names) => (
      <ConfigFileEntityList
        names={names}
        route={ApplicationRoute.PlatformCatalogSchemas}
        headerExtra={<ConfigFilesToggle />}
      />
    )}
  />
);

export default PlatformCatalogSchemasPageList;
