import { ApplicationRoute } from '@/src/types/routes';

/**
 * The seven views `config-file-entity-views` covers — those whose population is split between the
 * admin backend and Core's configuration file. Keys is excluded because Core refuses the config-file
 * `keys` route unconditionally. App Runners was excluded by the same reasoning until this was
 * confirmed against Core's `FileConfigController` source: App Runners' config-file population is
 * `ConfigFileEntityType.Schemas` (`schemas`) — Core's own term for the type
 * (`listFileConfigSchemas`, "file-sourced application type schemas"), not a distinct absence.
 *
 * Catalog Schemas is deliberately absent (Issue #4605). It was added as an eighth view by
 * `apply-catalog-schemas-to-deployments` on the strength of Core answering
 * `/v1/admin/config/file/catalog_schemas`, which says what Core can answer, not which views carry
 * the toggle. A file-declared catalog schema is reached at its own detail address instead — that
 * route resolves either population by `$id`.
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
