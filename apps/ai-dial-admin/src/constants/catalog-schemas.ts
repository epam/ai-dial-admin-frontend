import { CatalogEntityType, CatalogPropertyWidget } from '@/src/models/dial/catalog-schema';

export const CATALOG_ENTITY_TYPES: CatalogEntityType[] = Object.values(CatalogEntityType);

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
