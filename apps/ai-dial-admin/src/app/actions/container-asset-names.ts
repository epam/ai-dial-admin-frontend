'use server';

import { getConfigFileInterceptors, getInterceptors } from '@/src/app/[lang]/platform-interceptors/actions';
import { getConfigFileModels, getModels } from '@/src/app/[lang]/platform-models/actions';
import { ConfigFileReadResult } from '@/src/models/dial/config-file';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';

const NAME_SOURCES: Partial<
  Record<ApplicationRoute, [(path: string) => Promise<ResourceInfo[]>, () => Promise<ConfigFileReadResult<string[]>>]>
> = {
  [ApplicationRoute.PlatformModels]: [getModels, getConfigFileModels],
  [ApplicationRoute.PlatformInterceptors]: [getInterceptors, getConfigFileInterceptors],
};

const LOG_MESSAGE = 'Failed to list Core asset names for a container create';

const readPlatformNames = async (list: () => Promise<ResourceInfo[]>): Promise<string[]> => {
  try {
    return (await list()).map((item) => item.name);
  } catch (e) {
    errorObjLog(e, LOG_MESSAGE);
    return [];
  }
};

const readConfigFileNames = async (list: () => Promise<ConfigFileReadResult<string[]>>): Promise<string[]> => {
  try {
    const result = await list();
    if (result.success) {
      return result.data;
    }
    errorObjLog(result.failure, LOG_MESSAGE);
  } catch (e) {
    errorObjLog(e, LOG_MESSAGE);
  }
  return [];
};

/**
 * Every Core name a container-originated create of a flat platform type must reject: the platform
 * bucket and the config file. A config-file name is included because an API write under it replaces
 * that entity instead of failing. A failed read is logged and contributes nothing; Core still refuses
 * a same-bucket duplicate on write.
 */
export async function getContainerAssetNames(view: ApplicationRoute): Promise<string[]> {
  const sources = NAME_SOURCES[view];
  if (!sources) {
    return [];
  }

  const [listPlatform, listConfigFile] = sources;
  const [platformNames, configFileNames] = await Promise.all([
    readPlatformNames(() => listPlatform(`${PLATFORM_ROOT_FOLDER}/`)),
    readConfigFileNames(listConfigFile),
  ]);

  return [...platformNames, ...configFileNames];
}
