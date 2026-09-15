import { JSONSchema7, JSONSchema7Definition, JSONSchema7TypeName } from 'json-schema';

import {
  CATALOG_FALLBACK_LOCALE,
  CATALOG_FILE_REFERENCE_MAX_LENGTH,
  CATALOG_FILE_REFERENCE_PATTERN,
  CATALOG_META_LOCALIZED,
} from '@/src/constants/catalog-schemas';
import { CatalogSchemaDocument } from '@/src/models/dial/catalog-schema';
import { DIAL_FILE_KEY } from '@/src/utils/core-schemas/constants';
import { CatalogSchemaValidationError } from './validation';

const DIAL_META_KEY = 'dial:meta';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isAbsent = (value: unknown): boolean => value == null || value === '' || (Array.isArray(value) && !value.length);

const matchesType = (value: unknown, type: JSONSchema7TypeName): boolean => {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return isRecord(value);
    case 'null':
      return value === null;
    default:
      return true;
  }
};

const declaredTypes = (definition: JSONSchema7): JSONSchema7TypeName[] => {
  if (typeof definition.type === 'string') {
    return [definition.type];
  }
  return Array.isArray(definition.type) ? definition.type : [];
};

const isLocalized = (definition: JSONSchema7): boolean => {
  const meta = (definition as Record<string, unknown>)[DIAL_META_KEY];
  return isRecord(meta) && meta[CATALOG_META_LOCALIZED] === true;
};

const isFileValued = (definition: JSONSchema7): boolean =>
  (definition as Record<string, unknown>)[DIAL_FILE_KEY] === true;

const isFileReference = (value: unknown): boolean =>
  typeof value === 'string' &&
  value.length <= CATALOG_FILE_REFERENCE_MAX_LENGTH &&
  CATALOG_FILE_REFERENCE_PATTERN.test(value);

/** Core accepts a locale map here, so it is checked for the default locale rather than for its shape. */
const validateLocalized = (name: string, value: unknown, defaultLocale: string): CatalogSchemaValidationError[] =>
  isRecord(value) && !(defaultLocale in value)
    ? [{ field: name, message: `"${name}" must carry the default locale "${defaultLocale}"` }]
    : [];

const validateFileValue = (name: string, value: unknown): CatalogSchemaValidationError[] => {
  const values = Array.isArray(value) ? value : [value];
  return values.every(isFileReference)
    ? []
    : [{ field: name, message: `"${name}" must be a DIAL file reference such as files/{bucket}/{path}` }];
};

const validateValue = (
  name: string,
  definition: JSONSchema7,
  value: unknown,
  defaultLocale: string,
): CatalogSchemaValidationError[] => {
  if (isLocalized(definition) && isRecord(value)) {
    return validateLocalized(name, value, defaultLocale);
  }

  const types = declaredTypes(definition);
  if (types.length && !types.some((type) => matchesType(value, type))) {
    return [{ field: name, message: `"${name}" must be of type ${types.join(' or ')}` }];
  }

  if (Array.isArray(definition.enum) && !definition.enum.includes(value as never)) {
    return [{ field: name, message: `"${name}" must be one of ${definition.enum.join(', ')}` }];
  }

  return isFileValued(definition) ? validateFileValue(name, value) : [];
};

/**
 * For a platform-bucket resource this is the only gate in front of Core: invalid values are accepted
 * on write and then break the merged configuration at assembly. A user-bucket application or toolset
 * is additionally rejected by Core itself with a `400`, so Core's message stays the authority there.
 *
 * Three deliberate departures from Core: an empty string or empty array counts as absent for a
 * required property, because a text field left untouched is the case this gate exists for; no values
 * at all is not a failure, mirroring `CatalogSchemaService.validate`; and a property reported as
 * missing is not also reported as mistyped.
 */
export const validateCatalogProperties = (
  schema: CatalogSchemaDocument | undefined,
  values: Record<string, unknown> | undefined,
): CatalogSchemaValidationError[] => {
  if (!isRecord(schema) || values == null) {
    return [];
  }
  if (!isRecord(values)) {
    return [{ field: 'catalogProperties', message: 'Catalog properties must be a JSON object' }];
  }

  const properties = isRecord(schema.properties) ? (schema.properties as Record<string, JSONSchema7Definition>) : {};
  const required = Array.isArray(schema.required) ? schema.required.filter((name) => typeof name === 'string') : [];
  const defaultLocale =
    typeof schema['dial:defaultLocale'] === 'string' && schema['dial:defaultLocale']
      ? schema['dial:defaultLocale']
      : CATALOG_FALLBACK_LOCALE;

  const missingNames = required.filter((name) => isAbsent(values[name]));
  const missing = missingNames.map((name) => ({ field: name, message: `"${name}" is required` }));

  const invalid = Object.entries(properties).flatMap(([name, definition]) => {
    if (!isRecord(definition) || missingNames.includes(name) || !(name in values) || values[name] === undefined) {
      return [];
    }
    return validateValue(name, definition as JSONSchema7, values[name], defaultLocale);
  });

  return [...missing, ...invalid];
};
