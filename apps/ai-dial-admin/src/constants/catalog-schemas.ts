import { CatalogEntityType, CatalogPropertyWidget } from '@/src/models/dial/catalog-schema';

/**
 * What the console ACCEPTS on save: Core's full five, mirroring its catalog meta-schema. Consumed by
 * the save gate in `@/src/utils/catalog-schemas/validation.ts`.
 *
 * Deliberately wider than `OFFERED_CATALOG_ENTITY_TYPES`. Do not narrow this to match it: Core's
 * meta-schema `required`s the field and allows all five, so a configuration file may legally declare
 * a schema typed `skill`. Issue #4880 was exactly this conflation — the accept list had been
 * shortened along with the offered list, so such a schema opened in the console and then failed
 * every save with "Entity type must be one of ...".
 */
export const CATALOG_ENTITY_TYPES: CatalogEntityType[] = Object.values(CatalogEntityType);

/**
 * What the console OFFERS when authoring or editing a schema: four of Core's five. Consumed by the
 * entity-type selection on the catalog-schema Properties tab.
 *
 * `skill` is absent because a skill cannot carry a catalog schema — `Skill` does not extend
 * `Deployment` in Core, and this console's Skills view has no catalog surface to feed — so offering
 * it would invite authoring a schema nothing can reference.
 *
 * Spelled out rather than derived from `CATALOG_ENTITY_TYPES`, so that a future addition to Core's
 * meta-schema is accepted on save immediately but only becomes offerable when someone decides it
 * should be. Keeping these two lists separate is the Issue #4880 fix; do not merge them.
 */
export const OFFERED_CATALOG_ENTITY_TYPES: CatalogEntityType[] = [
  CatalogEntityType.Model,
  CatalogEntityType.Agent,
  CatalogEntityType.Toolset,
  CatalogEntityType.Interceptor,
];

/**
 * The `dial:catalogEntityType` each deployment surface's schema picker filters to.
 *
 * Applications map to `agent`, not `application`: Core's meta-schema has no `application` value.
 * That mismatch between this console's vocabulary and Core's is why the four pairings live here
 * under one name instead of being spelled inline at each picker call site.
 */
export const CATALOG_SCHEMA_PICKER_ENTITY_TYPE = {
  models: CatalogEntityType.Model,
  applications: CatalogEntityType.Agent,
  toolsets: CatalogEntityType.Toolset,
  interceptors: CatalogEntityType.Interceptor,
} as const satisfies Record<string, CatalogEntityType>;

export const CATALOG_PROPERTY_WIDGETS: CatalogPropertyWidget[] = Object.values(CatalogPropertyWidget);

/** `dial:defaultLocale`'s own pattern in Core's catalog meta-schema. */
export const CATALOG_DEFAULT_LOCALE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

export const CATALOG_META_TAB = 'dial:tab';
export const CATALOG_META_SECTION = 'dial:section';
export const CATALOG_META_WIDGET = 'dial:widget';
export const CATALOG_META_LOCALIZED = 'dial:localized';

/** The type/format pair Core's meta-schema requires alongside `dial:file`. */
export const CATALOG_FILE_PROPERTY_TYPE = 'string';
export const CATALOG_FILE_PROPERTY_FORMAT = 'dial-file-encoded';

/** The default locale Core falls back to when a schema declares no `dial:defaultLocale`. */
export const CATALOG_FALLBACK_LOCALE = 'en';

/** `DialFileFormat`'s own pattern and length cap — what `format: "dial-file-encoded"` accepts. */
export const CATALOG_FILE_REFERENCE_PATTERN = /^files\/[a-zA-Z0-9]+\/.*$/;
export const CATALOG_FILE_REFERENCE_MAX_LENGTH = 4096;
