import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { Token } from '@/src/models/auth';
import { AssetApi } from '@/src/server/core/asset-api';
import { ConfigFileApi } from '@/src/server/core/config-file-api';
import { ResourceType } from '@/src/types/resource-type';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';

/**
 * Core keeps models, applications, toolsets, interceptors, routers and aliases in one flat deployment-id
 * namespace, but its alias `PUT` does not guard it (the other five types are guarded with a 409): a platform alias
 * whose name is taken is written and applied, then skipped at the next config rebuild. Each entry pairs a type's
 * platform resources with its config-file population.
 */
const NAMESPACE_TYPES: readonly { resource: ResourceType; configFile: ConfigFileEntityType }[] = [
  { resource: ResourceType.MODEL, configFile: ConfigFileEntityType.Models },
  { resource: ResourceType.APPLICATION, configFile: ConfigFileEntityType.Applications },
  { resource: ResourceType.TOOLSET, configFile: ConfigFileEntityType.Toolsets },
  { resource: ResourceType.INTERCEPTOR, configFile: ConfigFileEntityType.Interceptors },
  { resource: ResourceType.ROUTER, configFile: ConfigFileEntityType.Routers },
  { resource: ResourceType.ALIAS, configFile: ConfigFileEntityType.Aliases },
];

/**
 * Whether `name` is already a deployment name. Best-effort: a read that fails is not a clash (Core stays the
 * arbiter at reload), and a concurrent write can still race it.
 */
export const isDeploymentNameTaken = async (
  assetApi: AssetApi,
  configFileApi: ConfigFileApi,
  token: Token,
  name: string,
): Promise<boolean> => {
  const checks = NAMESPACE_TYPES.flatMap(({ resource, configFile }) => [
    assetApi
      .list(token, resource, `${PLATFORM_ROOT_FOLDER}/`)
      .then((rows) => rows.some((row) => row.name === name))
      .catch(() => false),
    configFileApi
      .listNames(token, configFile)
      .then((result) => result.success && result.data.includes(name))
      .catch(() => false),
  ]);
  return (await Promise.all(checks)).some(Boolean);
};
