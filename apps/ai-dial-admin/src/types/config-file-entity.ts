/**
 * Entity types addressable on DIAL Core's `ADMIN_FILE_CONFIG` route
 * (`^/v1/admin/config/file/(?<type>...)(?:/(?<name>.+))?$` in `RouteTemplate.java`).
 *
 * Structurally addressable is not the same as readable — see `READABLE_CONFIG_FILE_TYPES`.
 */
export enum ConfigFileEntityType {
  Models = 'models',
  Interceptors = 'interceptors',
  Roles = 'roles',
  Keys = 'keys',
  Routes = 'routes',
  Schemas = 'schemas',
  CatalogSchemas = 'catalog_schemas',
  Settings = 'settings',
  Applications = 'applications',
  Toolsets = 'toolsets',
}

/** Why a config-file read produced no data, so a caller cannot mistake a refusal for an empty population. */
export enum ConfigFileFailureReason {
  /** Refused locally, before any request — the type is not in the readable allow-list. */
  TypeNotReadable = 'TypeNotReadable',
  /** Core was called and did not return a usable response. */
  RequestFailed = 'RequestFailed',
}

/** Which of Core's two populations an entity option came from. Carried as data — never inferred from a value's shape. */
export enum ConfigEntityOrigin {
  /** Written through Core's API, listed by `/v1/metadata/{type}/platform/`, referenced by canonical id. */
  Api = 'Api',
  /** Declared in Core's configuration files, listed by `/v1/admin/config/file/{type}`, referenced by bare name. */
  ConfigFile = 'ConfigFile',
}
