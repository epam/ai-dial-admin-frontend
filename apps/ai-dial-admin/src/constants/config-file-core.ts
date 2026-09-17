import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';

/** DIAL Core's config-file entity route (`ADMIN_FILE_CONFIG`). Read-only: non-GET answers 405 with `Allow: GET`. */
export const CORE_CONFIG_FILE_URL = 'v1/admin/config/file';

/**
 * Types this client may ask for. Narrower than the route's own type set on purpose.
 *
 * `Keys` is excluded because `FileConfigController` refuses it before the admin check, so it is 403
 * for every caller — the file map's keys are themselves the secrets. Deriving the supported set from
 * the route pattern instead would make the client appear to support it and fail only at runtime.
 *
 * `Models`, `Routes`, `Applications`, and `Toolsets` were added for `config-file-entity-views` — the
 * config-file-backed admin-grid list/detail surface for those types. Widening this set is a
 * deliberate act, not a side effect of adding an enum member.
 *
 * `Schemas` was added for the same surface's seventh covered type, App Runners: Core's `schemas`
 * config-file type is that entity's file-sourced population (confirmed against Core's
 * `FileConfigController` — `listFileConfigSchemas` is documented as "file-sourced application type
 * schemas", the same term App Runners uses for itself, and `entitySource()` resolves it to
 * `config.getApplicationTypeSchemas()`). `CatalogSchemas` remains excluded for a different
 * reason: `Catalog ▸ Catalog Schemas` exists (`platform-catalog-schemas`), but reads only the
 * API-written half. Its config-file population (`config.getCatalogSchemas()`) is deferred to the
 * follow-up change that also adds the consumer side, so widening this set is that change's call.
 */
export const READABLE_CONFIG_FILE_TYPES: ReadonlySet<ConfigFileEntityType> = new Set([
  ConfigFileEntityType.Interceptors,
  ConfigFileEntityType.Roles,
  ConfigFileEntityType.Settings,
  ConfigFileEntityType.Models,
  ConfigFileEntityType.Routes,
  ConfigFileEntityType.Applications,
  ConfigFileEntityType.Toolsets,
  ConfigFileEntityType.Schemas,
]);

/** The single settings entry Core exposes — `settings` is a singleton, not a listable collection. */
export const GLOBAL_SETTINGS_NAME = 'global';

/**
 * The `ResourceType` carrying the metadata half of a config type's population.
 *
 * `Settings` is deliberately absent: `ConfigResourceMetadataController` answers 405 for the
 * singleton, so it has no listing surface to union — its API-written half is read from the entity
 * URL `/v1/settings/platform/global` instead.
 */
export const METADATA_RESOURCE_TYPE: Partial<Record<ConfigFileEntityType, ResourceType>> = {
  [ConfigFileEntityType.Interceptors]: ResourceType.INTERCEPTOR,
  [ConfigFileEntityType.Roles]: ResourceType.ROLE,
};
