'use client';

import { ReactNode } from 'react';

import { useAppContext } from '@/src/context/AppContext';
import { useConfigFileEntityList } from '@/src/hooks/use-config-file-entity-list';
import { ConfigFileReadResult } from '@/src/models/dial/config-file';
import { DialLoader } from '@epam/ai-dial-ui-kit';

interface Props {
  /** The page's existing asset/platform list, rendered when `showConfigFiles` is off. */
  assetList: ReactNode;
  fetchConfigFileList: () => Promise<ConfigFileReadResult<string[]>>;
  /** Renders the shared config-file list (`ConfigFileEntityList`) with the fetched entity names. */
  renderConfigFileList: (names: string[]) => ReactNode;
}

/**
 * The `config-file-entity-views` list swap: one component shared by every covered view, so the
 * toggle/fetch/render wiring is written once rather than re-derived per entity type.
 */
const ConfigFileListSwap = ({ assetList, fetchConfigFileList, renderConfigFileList }: Props) => {
  const { showConfigFiles } = useAppContext();
  const { data, isLoading } = useConfigFileEntityList(showConfigFiles, fetchConfigFileList);

  return <>{showConfigFiles ? isLoading ? <DialLoader /> : renderConfigFileList(data) : assetList}</>;
};

export default ConfigFileListSwap;
