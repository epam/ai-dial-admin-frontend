import { SchemaMetaColumn } from './models';

export const DIAL_META_PROPERTY_ORDER = 'dial:propertyOrder';
export const DIAL_META_PROPERTY_KIND = 'dial:propertyKind';

export const APP_RUNNER_META_COLUMNS: SchemaMetaColumn[] = [SchemaMetaColumn.Order, SchemaMetaColumn.PropertyKind];

/** No property kind: every catalog field is client-visible, so the catalog meta-schema has none. */
export const CATALOG_SCHEMA_META_COLUMNS: SchemaMetaColumn[] = [
  SchemaMetaColumn.Tab,
  SchemaMetaColumn.Section,
  SchemaMetaColumn.Order,
  SchemaMetaColumn.Widget,
  SchemaMetaColumn.Localized,
];
