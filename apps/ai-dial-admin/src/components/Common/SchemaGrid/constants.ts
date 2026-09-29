import { SchemaFieldInputConfig, SchemaInputField, SchemaMetaColumn } from './models';

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

/**
 * Applied to every consumer unless it passes its own `fieldInputProps`. Core's catalog meta-schema
 * declares `title` and `description` as plain strings with no `maxLength`; if it ever adds one, these
 * must follow it.
 */
export const DEFAULT_SCHEMA_FIELD_INPUT_PROPS: SchemaFieldInputConfig = {
  [SchemaInputField.Name]: { maxLength: 255 },
  [SchemaInputField.Title]: { maxLength: 255 },
  [SchemaInputField.Tab]: { maxLength: 255 },
  [SchemaInputField.Section]: { maxLength: 255 },
  [SchemaInputField.Description]: { maxLength: 1024 },
};
