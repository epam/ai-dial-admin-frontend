import { SchemaMetaColumn } from './models';

export const DIAL_META_PROPERTY_ORDER = 'dial:propertyOrder';
export const DIAL_META_PROPERTY_KIND = 'dial:propertyKind';

export const NEW_FIELD_NAME_PREFIX = 'field_';

export const APP_RUNNER_META_COLUMNS: SchemaMetaColumn[] = [SchemaMetaColumn.Order, SchemaMetaColumn.PropertyKind];

/**
 * The part of `REQUIRED_PARAMETER_META_KEYS` (`utils/app-runners/constants.ts`) the grid can flag: the
 * property-kind select has no error state, so a missing kind surfaces only when the save is rejected.
 */
export const APP_RUNNER_REQUIRED_META_COLUMNS: SchemaMetaColumn[] = [SchemaMetaColumn.Order];

/** No property kind: every catalog field is client-visible, so the catalog meta-schema has none. */
export const CATALOG_SCHEMA_META_COLUMNS: SchemaMetaColumn[] = [
  SchemaMetaColumn.Tab,
  SchemaMetaColumn.Section,
  SchemaMetaColumn.Order,
  SchemaMetaColumn.Widget,
  SchemaMetaColumn.Localized,
];
