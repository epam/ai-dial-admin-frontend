import { DialScheme } from '@/src/models/dial/scheme';
import { JSONSchema7, JSONSchema7TypeName } from 'json-schema';

export const convertSchemaToTable = (schema?: DialScheme) => {
  if (!schema) return [];

  const { properties, required = [] } = schema;

  if (!properties) return [];

  return Object.entries(properties).map(([field, property]: [string, any]) => ({
    field,
    description: property?.description,
    type: property?.type,
    required: required.includes(field),
  }));
};

/** JSON pointer fragment (e.g. "definitions", "Foo") */
type RefPath = string[];

/**
 * Resolves a JSON Schema $ref (e.g. "#/definitions/Foo" or "#/$defs/Bar") against a root schema.
 * Returns the resolved schema or undefined if ref is invalid.
 */
export function resolveRef(root: JSONSchema7, ref: string): JSONSchema7 | undefined {
  if (!ref || !ref.startsWith('#/')) return undefined;
  const path = ref.slice(2).split('/').filter(Boolean) as RefPath;
  if (path.length === 0) return root;
  let current: unknown = root;
  for (const segment of path) {
    if (current == null || typeof current !== 'object' || !(segment in (current as object))) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'object' && current !== null && !Array.isArray(current)
    ? (current as JSONSchema7)
    : undefined;
}

/**
 * Returns the primary type for default/empty value when schema has type as string or array.
 */
function getPrimaryType(schema: JSONSchema7): JSONSchema7TypeName {
  const type = schema.type;
  if (typeof type === 'string') return type as JSONSchema7TypeName;
  if (Array.isArray(type) && type.length) {
    const first = type.find((x) => x !== 'null') ?? type[0];
    return first as JSONSchema7TypeName;
  }
  return 'string';
}

/**
 * Returns an empty value for a given JSON Schema type (when no default is set).
 */
function emptyValueByType(type: JSONSchema7TypeName): unknown {
  switch (type) {
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    case 'null':
      return null;
    default:
      return undefined;
  }
}

/** How to choose a variant when a property has anyOf/oneOf (e.g. string | null). */
export type VariantChoice =
  | 'preferNullIfNullableUnion' /** Default: if union mixes `null` with other types, default to null; otherwise first non-null. */
  | 'preferNonNull' /** First branch that is not type `null`. */
  | number; /** Branch at this index (0-based). */

export interface GetSchemaDefaultsOptions {
  /** When a property has anyOf/oneOf, which variant to use. Default: `preferNullIfNullableUnion`. */
  variantChoice?: VariantChoice;
}

function isNullOnlySchema(s: JSONSchema7): boolean {
  const t = s.type;
  return t === 'null' || (Array.isArray(t) && t.length === 1 && t[0] === 'null');
}

function pickVariant(
  variants: JSONSchema7[],
  variantChoice: VariantChoice,
  resolve: (s: JSONSchema7) => JSONSchema7,
): JSONSchema7 {
  const resolvedList = variants.map(resolve);

  if (variantChoice === 'preferNonNull') {
    const nonNull = resolvedList.find((r) => !isNullOnlySchema(r));
    return nonNull ?? resolvedList[0]!;
  }

  if (variantChoice === 'preferNullIfNullableUnion') {
    const hasNullBranch = resolvedList.some((r) => isNullOnlySchema(r));
    const hasNonNullBranch = resolvedList.some((r) => !isNullOnlySchema(r));
    if (hasNullBranch && hasNonNullBranch) {
      return resolvedList.find((r) => isNullOnlySchema(r))!;
    }
    const nonNull = resolvedList.find((r) => !isNullOnlySchema(r));
    return nonNull ?? resolvedList[0]!;
  }

  const index = Math.max(0, Math.min(variantChoice as number, variants.length - 1));
  return resolvedList[index]!;
}

/**
 * Returns a single default or type-based empty value for a schema (handles anyOf/oneOf via variant choice).
 */
function getDefaultOrEmptyValue(
  schema: JSONSchema7,
  rootSchema: JSONSchema7,
  resolve: (s: JSONSchema7) => JSONSchema7,
  options: GetSchemaDefaultsOptions | undefined,
  getDefaults: (s: JSONSchema7, root: JSONSchema7, opts?: GetSchemaDefaultsOptions) => Record<string, unknown>,
): unknown {
  // Default on the same object as $ref (e.g. { $ref: "#/$defs/X", default: "gemini-..." }) — not on the resolved target
  if (schema.default !== undefined) return schema.default;

  const effective = resolve(schema);

  // Use explicit default before recursing into oneOf/anyOf (e.g. enum with oneOf and default: "citation")
  if (effective.default !== undefined) return effective.default;

  const variants = effective.anyOf ?? effective.oneOf;
  const hasOwnShape = effective.type !== undefined || effective.properties !== undefined;
  if (!hasOwnShape && Array.isArray(variants) && variants.length) {
    const branch = pickVariant(
      variants.filter((v): v is JSONSchema7 => typeof v === 'object') as JSONSchema7[],
      options?.variantChoice ?? 'preferNullIfNullableUnion',
      resolve,
    );
    return getDefaultOrEmptyValue(branch, rootSchema, resolve, options, getDefaults);
  }

  const type = getPrimaryType(effective);

  if (type === 'object') {
    if (effective.properties) return getDefaults(effective, rootSchema, options);
    return {};
  }

  if (type === 'array') return [];

  return emptyValueByType(type);
}

/**
 * Fills default values from a JSON Schema (with $ref support).
 * - Uses each property's `default` when present (including next to `$ref` on the same schema object).
 * - When no default: returns empty value by type ('' for string, 0 for number/integer, false for boolean, [] for array, {} for object, null for null).
 * - Resolves $ref against the root schema (definitions / $defs).
 * - For anyOf/oneOf: default `preferNullIfNullableUnion` (T|null → null); use `preferNonNull` or a numeric index to override.
 * - Recursively fills nested object properties and object items in arrays.
 *
 * @param schema - JSON Schema (typically type: 'object' with properties). May contain $ref.
 * @param root - Root schema used to resolve $ref (default: schema itself).
 * @param options - Optional. variantChoice: `preferNullIfNullableUnion` (default), `preferNonNull`, or branch index.
 * @returns Plain JS object with property keys and default/empty values.
 */
export function getSchemaDefaults(
  schema: JSONSchema7,
  root?: JSONSchema7,
  options?: GetSchemaDefaultsOptions,
): Record<string, unknown> {
  const rootSchema = root ?? schema;

  const resolve = (s: JSONSchema7): JSONSchema7 => {
    if (s.$ref) {
      const resolved = resolveRef(rootSchema, s.$ref);
      return resolved ? resolve(resolved) : s;
    }
    return s;
  };

  const resolvedSchema = resolve(schema);

  if (!resolvedSchema.properties) {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, def] of Object.entries(resolvedSchema.properties)) {
    if (def === undefined || typeof def !== 'object') continue;
    const propSchema = def as JSONSchema7;
    result[key] = getDefaultOrEmptyValue(propSchema, rootSchema, resolve, options, getSchemaDefaults);
  }

  return result;
}
