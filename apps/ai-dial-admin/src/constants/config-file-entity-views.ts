import { ApplicationRoute } from '@/src/types/routes';

/**
 * The seven views `config-file-entity-views` covers. Keys is excluded because Core refuses the
 * config-file `keys` route unconditionally. App Runners was excluded by the same reasoning until
 * this was confirmed against Core's `FileConfigController` source: App Runners' config-file
 * population is `ConfigFileEntityType.Schemas` (`schemas`) — Core's own term for the type
 * (`listFileConfigSchemas`, "file-sourced application type schemas"), not a distinct absence.
 */
export const CONFIG_FILE_ENTITY_VIEWS: ReadonlySet<ApplicationRoute> = new Set([
  ApplicationRoute.PlatformModels,
  ApplicationRoute.PlatformInterceptors,
  ApplicationRoute.PlatformRoutes,
  ApplicationRoute.PlatformRoles,
  ApplicationRoute.PlatformAppRunners,
  ApplicationRoute.AssetsApplications,
  ApplicationRoute.AssetsToolsets,
]);
