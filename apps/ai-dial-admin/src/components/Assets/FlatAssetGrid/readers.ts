import { getApps, getConfigFileApplications } from '@/src/app/[lang]/assets-applications/actions';
import { getConfigFileToolsets, getToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import { getConfigFileAppRunners, getRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import { getCatalogSchemas, getConfigFileCatalogSchemas } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { getConfigFileInterceptors, getInterceptors } from '@/src/app/[lang]/platform-interceptors/actions';
import { getKeys } from '@/src/app/[lang]/platform-keys/actions';
import { getConfigFileModels, getModels } from '@/src/app/[lang]/platform-models/actions';
import { getPolicies } from '@/src/app/[lang]/platform-policies/actions';
import { getPolicyAssignments } from '@/src/app/[lang]/platform-policy-assignments/actions';
import { getConfigFileRoles, getRoles } from '@/src/app/[lang]/platform-roles/actions';
import { getConfigFileRouters, getRouters } from '@/src/app/[lang]/platform-routers/actions';
import { getConfigFileRoutes, getRoutes } from '@/src/app/[lang]/platform-routes/actions';
import { getConfigFileTranslators, getTranslators } from '@/src/app/[lang]/platform-translators/actions';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';
import { ConfigFileReadResult } from '@/src/models/dial/config-file';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { toConfigFileItems } from '@/src/utils/files/folder-nodes';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { FlatReadResult } from './models';

type ListFolder = (path: string) => Promise<AssetListItem[] | null | undefined>;
type ListConfigFileNames = () => Promise<ConfigFileReadResult<string[]>>;

interface FlatReader {
  list: ListFolder;
  listConfigFileNames?: ListConfigFileNames;
  /** Records live one folder level down (the cost object), so the folders are listed and flattened. */
  isNested?: boolean;
}

const FLAT_READERS: Partial<Record<ApplicationRoute, FlatReader>> = {
  [ApplicationRoute.PlatformModels]: { list: getModels, listConfigFileNames: getConfigFileModels },
  [ApplicationRoute.PlatformAppRunners]: { list: getRunners, listConfigFileNames: getConfigFileAppRunners },
  [ApplicationRoute.PlatformCatalogSchemas]: {
    list: getCatalogSchemas,
    listConfigFileNames: getConfigFileCatalogSchemas,
  },
  [ApplicationRoute.PlatformInterceptors]: { list: getInterceptors, listConfigFileNames: getConfigFileInterceptors },
  [ApplicationRoute.PlatformTranslators]: { list: getTranslators, listConfigFileNames: getConfigFileTranslators },
  [ApplicationRoute.PlatformRouters]: { list: getRouters, listConfigFileNames: getConfigFileRouters },
  [ApplicationRoute.PlatformRoutes]: { list: getRoutes, listConfigFileNames: getConfigFileRoutes },
  [ApplicationRoute.PlatformRoles]: { list: getRoles, listConfigFileNames: getConfigFileRoles },
  [ApplicationRoute.PlatformKeys]: { list: getKeys },
  [ApplicationRoute.PlatformPolicies]: { list: getPolicies, isNested: true },
  [ApplicationRoute.PlatformPolicyAssignments]: { list: getPolicyAssignments, isNested: true },
  [ApplicationRoute.AssetsApplications]: { list: getApps, listConfigFileNames: getConfigFileApplications },
  [ApplicationRoute.AssetsToolsets]: { list: getToolsets, listConfigFileNames: getConfigFileToolsets },
};

const isFolder = (row: AssetListItem): boolean => row.nodeType === DialFileNodeType.FOLDER;
const isRecord = (row: AssetListItem): boolean => !isFolder(row);

const readPlatformRows = async (reader: FlatReader): Promise<AssetListItem[]> => {
  const root = (await reader.list(`${PLATFORM_ROOT_FOLDER}/`)) ?? [];
  if (!reader.isNested) {
    return root;
  }

  const nested = await Promise.all(root.filter(isFolder).map((folder) => reader.list(folder.path)));
  return [...root.filter(isRecord), ...nested.flatMap((rows) => (rows ?? []).filter(isRecord))];
};

/**
 * One flat read for a listing's Platform or config.json source. A failed read is reported as such, never as
 * an empty list, so a caller cannot show a count of zero for a source it could not read.
 */
export const readFlatAssets = async (
  view: ApplicationRoute,
  source: AssetSource.Platform | AssetSource.ConfigFile,
): Promise<FlatReadResult> => {
  const reader = FLAT_READERS[view];
  if (!reader) {
    return { success: false };
  }

  if (source === AssetSource.Platform) {
    return { success: true, rows: await readPlatformRows(reader) };
  }

  if (!reader.listConfigFileNames) {
    return { success: false };
  }

  const result = await reader.listConfigFileNames();
  if (!result.success) {
    return { success: false, errorHeader: result.failure.errorHeader, errorMessage: result.failure.errorMessage };
  }

  return { success: true, rows: toConfigFileItems(result.data) };
};
