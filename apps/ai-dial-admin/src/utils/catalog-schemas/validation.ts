import { JSONSchema7 } from 'json-schema';

import {
  CATALOG_DEFAULT_LOCALE_PATTERN,
  CATALOG_ENTITY_TYPES,
  CATALOG_FILE_PROPERTY_FORMAT,
  CATALOG_FILE_PROPERTY_TYPE,
} from '@/src/constants/catalog-schemas';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { CORE_UNENCODABLE_ID_CHARS, DIAL_FILE_KEY } from '@/src/utils/core-schemas/constants';
import { hasUnencodableSchemaIdChars } from '@/src/utils/core-schemas/resource-name';

export interface CatalogSchemaValidationError {
  field: string;
  message: string;
}

const ENTITY_TYPE_FIELD = 'dial:catalogEntityType';
const DISPLAY_NAME_FIELD = 'dial:catalogDisplayName';
const DEFAULT_LOCALE_FIELD = 'dial:defaultLocale';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const validateId = (schema: DialCatalogSchemaResource): CatalogSchemaValidationError[] => {
  if (typeof schema.$id !== 'string') {
    return schema.$id == null
      ? [{ field: '$id', message: 'Id is required' }]
      : [{ field: '$id', message: 'Id must be a string' }];
  }
  if (!schema.$id.trim()) {
    return [{ field: '$id', message: 'Id is required' }];
  }
  if (hasUnencodableSchemaIdChars(schema.$id)) {
    return [{ field: '$id', message: `Id must not contain any of ${CORE_UNENCODABLE_ID_CHARS.join(' ')}` }];
  }
  return [];
};

const validateEntityType = (schema: DialCatalogSchemaResource): CatalogSchemaValidationError[] => {
  const entityType = schema[ENTITY_TYPE_FIELD];
  if (!entityType) {
    return [{ field: ENTITY_TYPE_FIELD, message: 'Entity type is required' }];
  }
  if (!CATALOG_ENTITY_TYPES.includes(entityType)) {
    return [
      {
        field: ENTITY_TYPE_FIELD,
        message: `Entity type must be one of ${CATALOG_ENTITY_TYPES.join(', ')}`,
      },
    ];
  }
  return [];
};

const validateDefaultLocale = (schema: DialCatalogSchemaResource): CatalogSchemaValidationError[] => {
  const locale = schema[DEFAULT_LOCALE_FIELD];
  if (locale == null || locale === '') {
    return [];
  }
  if (typeof locale !== 'string' || !CATALOG_DEFAULT_LOCALE_PATTERN.test(locale)) {
    return [
      {
        field: DEFAULT_LOCALE_FIELD,
        message: 'Default locale must be a BCP-47 tag such as "en" or "en-US"',
      },
    ];
  }
  return [];
};

/**
 * A property declaring only `dial:file`, without the type/format pair the meta-schema requires
 * beside it, is accepted on write and then fails conformance.
 */
const validateFileProperty = (name: string, definition: unknown): CatalogSchemaValidationError[] => {
  if (!isRecord(definition) || definition[DIAL_FILE_KEY] !== true) {
    return [];
  }
  const field = `properties.${name}`;
  if (definition.type !== CATALOG_FILE_PROPERTY_TYPE || definition.format !== CATALOG_FILE_PROPERTY_FORMAT) {
    return [
      {
        field,
        message: `A file property must declare type "${CATALOG_FILE_PROPERTY_TYPE}" and format "${CATALOG_FILE_PROPERTY_FORMAT}"`,
      },
    ];
  }
  return [];
};

const validateProperties = (schema: DialCatalogSchemaResource): CatalogSchemaValidationError[] => {
  const properties = schema.properties as JSONSchema7['properties'] | undefined;
  if (properties == null) {
    return [];
  }
  if (!isRecord(properties)) {
    return [{ field: 'properties', message: 'Properties must be an object keyed by property name' }];
  }
  return Object.entries(properties).flatMap(([name, definition]) => validateFileProperty(name, definition));
};

/**
 * Core stores this resource's body verbatim and validates only the `$id`, so a schema violating the
 * catalog meta-schema is accepted on write and surfaces later — as an `invalid` status on read, and
 * as a rejected deployment for anything referencing it.
 *
 * The raw JSON editor can hand this arbitrary parsed JSON, so every field is shape-checked before
 * use: a wrong type must come back as a validation error, never as a thrown `TypeError` that leaves
 * the save button inert.
 */
export const validateCatalogSchema = (schema: DialCatalogSchemaResource): CatalogSchemaValidationError[] => {
  if (!isRecord(schema)) {
    return [{ field: '$id', message: 'A catalog schema must be a JSON object' }];
  }

  const displayName = schema[DISPLAY_NAME_FIELD];
  const displayNameErrors =
    typeof displayName === 'string' && displayName.trim()
      ? []
      : [{ field: DISPLAY_NAME_FIELD, message: 'Display name is required' }];

  return [
    ...validateId(schema),
    ...validateEntityType(schema),
    ...displayNameErrors,
    ...validateDefaultLocale(schema),
    ...validateProperties(schema),
  ];
};

export const isValidCatalogSchema = (schema: DialCatalogSchemaResource): boolean =>
  !validateCatalogSchema(schema).length;
