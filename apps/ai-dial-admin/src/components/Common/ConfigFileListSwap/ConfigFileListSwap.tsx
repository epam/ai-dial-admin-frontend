'use client';

import { ReactNode } from 'react';

import { useAppContext } from '@/src/context/AppContext';
import { useConfigFileEntityList } from '@/src/hooks/use-config-file-entity-list';
import { ConfigFileListResult, ConfigFileReadResult } from '@/src/models/dial/config-file';
import { DialLoader } from '@epam/ai-dial-ui-kit';

interface Props<T> {
  /** The page's existing asset/platform list, rendered when `showConfigFiles` is off. */
  assetList: ReactNode;
  fetchConfigFileList: () => Promise<ConfigFileReadResult<ConfigFileListResult<T>>>;
  /** Renders the entity's existing admin-grid list component with the fetched config-file entities. */
  renderConfigFileList: (data: T[]) => ReactNode;
}

/**
 * The `config-file-entity-views` list swap: one component shared by all six covered views, so the
 * toggle/fetch/render wiring is written once rather than re-derived per entity type.
 */
const ConfigFileListSwap = <T,>({ assetList, fetchConfigFileList, renderConfigFileList }: Props<T>) => {
  const { showConfigFiles } = useAppContext();
  const { data, isLoading } = useConfigFileEntityList(showConfigFiles, fetchConfigFileList);

  return <>{showConfigFiles ? isLoading ? <DialLoader /> : renderConfigFileList(data) : assetList}</>;
};

export default ConfigFileListSwap;
