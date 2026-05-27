import { JSONSchema7, JSONSchema7Definition, JSONSchema7TypeName } from 'json-schema';

import { resolveRef } from '@/src/utils/schema';

export interface SchemaFieldRow {
  id: string;
  name: string;
  type: JSONSchema7TypeName;
  /** For array fields: the type of items in the array (e.g. 'string', 'object'). Only defined when type === 'array'. */
  itemsType?: JSONSchema7TypeName;
  /**
   * Object with only `additionalProperties` (no fixed `properties`): a string-keyed map whose values are
   * arrays of this primitive item type (e.g. `Record<string, string[]>`).
   */
  additionalPropertiesArrayItemType?: JSONSchema7TypeName;
  required: boolean;
  title: string;
  description: string;
  expanded: boolean;
  children: SchemaFieldRow[];
  parentId: string | null;
  depth: number;
  isAddSubFieldRow?: boolean;
  /** Value of dial:meta from schema (first-level only). Stored as-is, e.g. { "dial:propertyKind": "server", "dial:propertyOrder": 1 }. */
  dialMeta?: Record<string, unknown>;
  /** Enum values from schema when property has "enum". */
  enum?: string[];
  /** Default value from schema (e.g. for bindings row default). */
  defaultValue?: unknown;
  minimum?: number;
  maximum?: number;
}

export interface SchemaTreeNode {
  path: string;
  name: string;
  type: JSONSchema7TypeName;
  children: SchemaTreeNode[];
  /** Value of dial:meta from schema (first-level only). Stored as-is. */
  dialMeta?: Record<string, unknown>;
}

const SCHEMA_TYPES: JSONSchema7TypeName[] = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'];
const DIAL_META_KEY = 'dial:meta';
const MAP_ARRAY_ITEM_PRIMITIVE_TYPES = new Set<JSONSchema7TypeName>(['string', 'number', 'integer', 'boolean']);

export const getSchemaTypes = (): JSONSchema7TypeName[] => SCHEMA_TYPES;

let nextId = 0;
export const generateFieldId = (): string => `schema-field-${++nextId}`;

export const createEmptyField = (parentId: string | null = null, depth = 0): SchemaFieldRow => ({
  id: generateFieldId(),
  name: '',
  type: 'string',
  required: false,
  title: '',
  description: '',
  expanded: false,
  children: [],
  parentId,
  depth,
});

const isJSONSchema7 = (def: JSONSchema7Definition): def is JSONSchema7 => typeof def === 'object';

/**
 * Retrieve correct parts from schema for comparison between states to smoothly re-render grid
 *
 * @param {(JSONSchema7 | undefined)} s - schema, which may have unused fields
 * @returns {(Pick<JSONSchema7, 'type' | 'properties' | 'required'> | undefined)} - new object with only necessary fields for grid, or undefined if input is undefined
 */
export const getGridSchemaPart = (
  s: JSONSchema7 | undefined,
): Pick<JSONSchema7, 'type' | 'properties' | 'required'> | undefined => {
  if (!s) return undefined;
  return { type: s.type, properties: s.properties, required: s.required };
};

/**
 * Resolve $ref from scheme definitions
 *
 * @param {JSONSchema7Definition} def - scheme definition which may have $ref inside
 * @param {JSONSchema7} root - root scheme where $defs array is located
 * @returns {JSONSchema7Definition} - resolved definition or original if resolution fails
 */
export const resolveDef = (def: JSONSchema7Definition, root: JSONSchema7): JSONSchema7Definition => {
  if (typeof def !== 'object' || !def || !('$ref' in def) || !def.$ref) return def;
  const resolved = resolveRef(root, def.$ref);
  return resolved ?? def;
};

/**
 * Check if schema type is null only
 *
 * @param {JSONSchema7} schema - schema to check
 * @returns {boolean} - true if schema type is 'null' or ['null'], false otherwise
 */
export const isNullOnly = (schema: JSONSchema7): boolean => {
  if (schema.type === 'null') {
    return true;
  }
  if (Array.isArray(schema.type) && schema.type.length === 1 && schema.type[0] === 'null') {
    return true;
  }
  return false;
};

/**
 * Get the effective schema by resolving $ref and handling anyOf/oneOf to find the first non-null variant.
 * This is used to determine the actual structure of fields for the grid.
 *
 * @param {JSONSchema7Definition} def - definition which may have $ref and/or anyOf/oneOf
 * @param {JSONSchema7} root - root schema for resolving $ref
 * @returns {(JSONSchema7 | null)} - effective schema with $ref resolved and anyOf/oneOf handled, or null if it cannot be determined
 */
const getVariantScore = (schema: JSONSchema7): number => {
  if (schema.properties && Object.keys(schema.properties).length > 0) {
    return 2;
  }
  if (schema.type && !isNullOnly(schema)) {
    return 1;
  }
  return 0;
};

export const getEffectiveSchema = (def: JSONSchema7Definition, root: JSONSchema7): JSONSchema7 | null => {
  if (typeof def !== 'object' || !def) {
    return null;
  }
  let current = resolveDef(def, root);
  if (typeof current !== 'object' || !current) {
    return null;
  }
  const variants = current.anyOf ?? current.oneOf;
  if (Array.isArray(variants) && variants.length > 0) {
    // Parent already defines shape (e.g. anyOf used only for validation constraints).
    if (current.properties && Object.keys(current.properties).length > 0) {
      return current;
    }
    const resolvedVariants = variants
      .map((v) => (typeof v === 'object' && v ? (resolveDef(v, root) as JSONSchema7) : null))
      .filter((v): v is JSONSchema7 => !!v && !isNullOnly(v));
    const chosen =
      resolvedVariants.length > 0
        ? resolvedVariants.reduce((best, v) => (getVariantScore(v) > getVariantScore(best) ? v : best))
        : null;
    const variant = chosen ?? (typeof variants[0] === 'object' && variants[0] ? variants[0] : null);
    if (variant) {
      const resolved = resolveDef(variant, root) as JSONSchema7;
      return resolved ?? null;
    }
  }
  return current;
};

/**
 * Get the primary type from a schema (handles type as string or array, e.g. ['string','null']).
 *
 * @param {JSONSchema7} schema - schema to extract the primary type from
 * @returns {JSONSchema7TypeName} - primary type of the schema
 */
export const getPrimaryType = (schema: JSONSchema7): JSONSchema7TypeName => {
  const type = schema.type;
  if (typeof type === 'string') {
    return type as JSONSchema7TypeName;
  }
  if (Array.isArray(type) && type.length) {
    const first = type.find((x) => x !== 'null') ?? type[0];
    return first as JSONSchema7TypeName;
  }
  return 'string';
};

/**
 * Recursively convert a single schema property definition into a SchemaFieldRow.
 * Handles $ref resolution, anyOf/oneOf, and nested object/array children at any depth.
 *
 * @param {string} name - property name
 * @param {JSONSchema7Definition} def - raw definition from the schema
 * @param {JSONSchema7} rootSchema - root schema for resolving $ref
 * @param {(string | null)} parentId - id of the parent field row
 * @param {number} depth - current depth level
 * @param {boolean} isRequired - whether this property is required
 * @param {boolean} isFirstLevel - whether this is a first-level (depth 0) property (for dialMeta extraction)
 * @returns {SchemaFieldRow} - the resulting schema field row with children recursively resolved
 */
const convertPropertyToField = (
  name: string,
  def: JSONSchema7Definition,
  rootSchema: JSONSchema7,
  parentId: string | null,
  depth: number,
  isRequired: boolean,
  isFirstLevel: boolean,
): SchemaFieldRow => {
  const resolvedDef = resolveDef(def, rootSchema);
  if (!isJSONSchema7(resolvedDef)) {
    return { ...createEmptyField(parentId, depth), name };
  }

  const effectiveDef = getEffectiveSchema(def, rootSchema) ?? (resolvedDef as JSONSchema7);
  const type = getPrimaryType(effectiveDef);
  const rawDef = isFirstLevel && typeof def === 'object' && def !== null ? (def as Record<string, unknown>) : null;
  const dialMeta =
    rawDef && typeof rawDef[DIAL_META_KEY] === 'object' && rawDef[DIAL_META_KEY] !== null
      ? (rawDef[DIAL_META_KEY] as Record<string, unknown>)
      : undefined;
  const propSchema = resolvedDef as JSONSchema7;
  const enumValues = Array.isArray(propSchema.enum) ? propSchema.enum.map((v) => String(v)) : undefined;

  const field: SchemaFieldRow = {
    id: generateFieldId(),
    name,
    type,
    required: isRequired,
    title: propSchema.title ?? effectiveDef.title ?? '',
    description: propSchema.description ?? effectiveDef.description ?? '',
    expanded: false,
    children: [],
    parentId,
    depth,
    ...(propSchema.minimum !== undefined && { minimum: propSchema.minimum }),
    ...(propSchema.maximum !== undefined && { maximum: propSchema.maximum }),
    ...(dialMeta && Object.keys(dialMeta).length > 0 && { dialMeta }),
    ...(enumValues?.length && { enum: enumValues }),
    ...(propSchema.default !== undefined && { defaultValue: propSchema.default }),
  };

  const objectPropertyKeys = effectiveDef.properties ? Object.keys(effectiveDef.properties) : [];

  if (type === 'object' && objectPropertyKeys.length > 0) {
    const nestedRequired = effectiveDef.required || [];
    field.children = Object.entries(effectiveDef.properties!).map(([childName, childDef]) =>
      convertPropertyToField(
        childName,
        childDef,
        rootSchema,
        field.id,
        depth + 1,
        nestedRequired.includes(childName),
        false,
      ),
    );
    if (field.children.length) {
      field.expanded = true;
    }
  } else if (type === 'object' && effectiveDef.additionalProperties && effectiveDef.additionalProperties !== true) {
    const addlRaw = resolveDef(effectiveDef.additionalProperties, rootSchema);
    if (isJSONSchema7(addlRaw)) {
      const addlEffective = getEffectiveSchema(effectiveDef.additionalProperties, rootSchema) ?? addlRaw;
      const addlType = getPrimaryType(addlEffective);
      if (addlType === 'array') {
        const itemsDef = addlEffective.items;
        if (itemsDef && !Array.isArray(itemsDef) && isJSONSchema7(itemsDef as JSONSchema7Definition)) {
          const itemResolved =
            getEffectiveSchema(itemsDef as JSONSchema7Definition, rootSchema) ?? resolveDef(itemsDef, rootSchema);
          if (isJSONSchema7(itemResolved)) {
            const itemType = getPrimaryType(itemResolved);
            if (MAP_ARRAY_ITEM_PRIMITIVE_TYPES.has(itemType)) {
              field.additionalPropertiesArrayItemType = itemType;
            }
          }
        }
      }
    }
  } else if (
    type === 'array' &&
    effectiveDef.items &&
    !Array.isArray(effectiveDef.items) &&
    typeof effectiveDef.items === 'object' &&
    isJSONSchema7(effectiveDef.items as JSONSchema7Definition)
  ) {
    const rawItems = effectiveDef.items as JSONSchema7;
    if (rawItems.properties) {
      field.itemsType = 'object';
      const nestedRequired = rawItems.required || [];
      field.children = Object.entries(rawItems.properties).map(([childName, childDef]) =>
        convertPropertyToField(
          childName,
          childDef,
          rootSchema,
          field.id,
          depth + 1,
          nestedRequired.includes(childName),
          false,
        ),
      );
      if (field.children.length) {
        field.expanded = true;
      }
    } else {
      const effectiveChild = getEffectiveSchema(rawItems, rootSchema) ?? resolveDef(rawItems, rootSchema);
      if (!isJSONSchema7(effectiveChild)) {
        return { ...createEmptyField(field.id, depth + 1), name: field.name };
      }
      const childSchema = effectiveChild as JSONSchema7;
      const childType = getPrimaryType(childSchema);
      field.itemsType = childType;
      if (childType === 'object') {
        field.children = jsonSchemaToFields(childSchema, rootSchema).map((child) => ({
          ...child,
          parentId: field.id,
          depth: depth + 1,
        }));
        if (field.children.length) {
          field.expanded = true;
        }
      }
    }
  }

  return field;
};

/**
 * Convert every definition into grid row, handle all types and nested structures, resolve $ref and effective schema for correct type detection.
 * Uses recursive convertPropertyToField to deeply resolve $ref at any nesting level.
 *
 * @param {(JSONSchema7 | undefined)} schema - JSON schema to convert, expected to be of type 'object' with properties
 * @param {?JSONSchema7} [root] - root schema for resolving $ref
 * @returns {SchemaFieldRow[]} - array of schema field rows
 */
export const jsonSchemaToFields = (schema: JSONSchema7 | undefined, root?: JSONSchema7): SchemaFieldRow[] => {
  if (!schema || !schema.properties) {
    return [];
  }
  const rootSchema = root ?? schema;
  const requiredFields = schema.required || [];

  return Object.entries(schema.properties).map(([name, def]) =>
    convertPropertyToField(name, def, rootSchema, null, 0, requiredFields.includes(name), true),
  );
};

/**
 * Converts an array of schema field rows into a JSON schema.
 *
 * @param {SchemaFieldRow[]} fields - array of schema field rows to convert, expected to have a tree structure with parent-child relationships
 * @returns {JSONSchema7} - the resulting JSON schema
 */
export const fieldsToJsonSchema = (fields: SchemaFieldRow[]): JSONSchema7 => {
  const schema: JSONSchema7 = { type: 'object', properties: {}, required: [] };

  fields.forEach((field) => {
    const fieldName = field.name;
    const prop: JSONSchema7 & Record<string, unknown> = { type: field.type };

    if (field.title) {
      prop.title = field.title;
    }
    if (field.description) {
      prop.description = field.description;
    }

    if (field.type === 'object') {
      if (field.children?.length) {
        const nested = fieldChildrenToObjectSchema(field.children);
        prop.properties = nested.properties;
        if (nested.required?.length) {
          prop.required = nested.required;
        }
      } else if (field.additionalPropertiesArrayItemType) {
        prop.additionalProperties = {
          type: 'array',
          items: { type: field.additionalPropertiesArrayItemType },
        };
      } else {
        prop.properties = {};
      }
    } else if (field.type === 'array') {
      if (field.itemsType === 'object') {
        prop.items =
          field.children?.length > 0 ? fieldChildrenToObjectSchema(field.children) : { type: 'object', properties: {} };
      } else if (field.itemsType) {
        prop.items = { type: field.itemsType };
      } else {
        prop.items = field.children?.length > 0 ? fieldChildrenToObjectSchema(field.children) : { type: 'string' };
      }
    }

    if (field.parentId === null && field.dialMeta) {
      prop[DIAL_META_KEY] = field.dialMeta;
    }

    schema.properties![fieldName] = prop as JSONSchema7;
    if (field.required) {
      (schema.required as string[]).push(fieldName);
    }
  });

  if (!(schema.required as string[])?.length) {
    delete schema.required;
  }

  return schema;
};

/**
 * Convert definition scheme children for nested structures in grid back to JSON schema recursively, used for object type with properties and array type with items.
 *
 * @param {SchemaFieldRow[]} children - array of schema field rows which are children of a parent field, expected to have a tree structure with parent-child relationships
 * @returns {JSONSchema7} - the resulting JSON schema representing the children, with type 'object' and properties for object type, or with items for array type
 */
const fieldChildrenToObjectSchema = (children: SchemaFieldRow[]): JSONSchema7 => {
  const schema: JSONSchema7 = { type: 'object', properties: {} };
  const requiredList: string[] = [];

  children.forEach((child) => {
    const childName = child.name;
    const childProp: JSONSchema7 = { type: child.type };
    if (child.title) childProp.title = child.title;
    if (child.description) childProp.description = child.description;

    if (child.type === 'object') {
      if (child.children?.length) {
        const nested = fieldChildrenToObjectSchema(child.children);
        childProp.properties = nested.properties;
        if (nested.required?.length) {
          childProp.required = nested.required;
        }
      } else if (child.additionalPropertiesArrayItemType) {
        childProp.additionalProperties = {
          type: 'array',
          items: { type: child.additionalPropertiesArrayItemType },
        };
      } else {
        childProp.properties = {};
      }
    } else if (child.type === 'array') {
      if (child.itemsType === 'object') {
        childProp.items =
          child.children?.length > 0 ? fieldChildrenToObjectSchema(child.children) : { type: 'object', properties: {} };
      } else if (child.itemsType) {
        childProp.items = { type: child.itemsType };
      } else {
        childProp.items = child.children?.length > 0 ? fieldChildrenToObjectSchema(child.children) : { type: 'string' };
      }
    }

    schema.properties![childName] = childProp;
    if (child.required) {
      requiredList.push(childName);
    }
  });

  if (requiredList.length) {
    schema.required = requiredList;
  }

  return schema;
};

/**
 * Fully flatten the tree structure of schema field rows into a flat array for grid consumption, while keeping track of depth for indentation and parent-child relationships.
 * Also adds "Add Sub-field" rows for object and array types, and a root "Add Field" row if not readonly.
 *
 * @param {SchemaFieldRow[]} fields - array of schema field rows with tree structure (parent-child relationships) to flatten
 * @param {number} [depth=0] - current depth level for indentation, used for recursion (start with 0 for root level)
 * @param {?boolean} [isReadonly] - flag indicating if the grid is in readonly mode, which determines whether to include "Add Field" rows
 * @returns {SchemaFieldRow[]} - flat array of schema field rows with depth information and "Add Field" rows included as needed, suitable for grid consumption
 */
export const flattenFields = (fields: SchemaFieldRow[], depth = 0, isReadonly?: boolean): SchemaFieldRow[] => {
  const result: SchemaFieldRow[] = [];

  fields.forEach((field) => {
    result.push({ ...field, depth });

    const canExpand =
      field.type === 'object' || (field.type === 'array' && (field.itemsType === 'object' || !field.itemsType));
    if (canExpand && field.expanded) {
      if (field.children?.length) {
        result.push(...flattenFields(field.children, depth + 1, isReadonly));
      }
      if (!isReadonly) {
        result.push({
          id: `add-sub-${field.id}`,
          name: '',
          type: 'string',
          required: false,
          title: '',
          description: '',
          expanded: false,
          children: [],
          parentId: field.id,
          depth: depth + 1,
          isAddSubFieldRow: true,
        });
      }
    }
  });

  if (!isReadonly && depth === 0) {
    result.push({
      id: 'add-root-field',
      name: '',
      type: 'string',
      required: false,
      title: '',
      description: '',
      expanded: false,
      children: [],
      parentId: null,
      depth: 0,
      isAddSubFieldRow: true,
    });
  }

  return result;
};

/**
 * Partial implementation of converting a JSON schema to tree nodes. Just to have simple tree structure for field paths in JSONata editor, without all the extra info needed for the grid.
 * Does not handle all cases (e.g. arrays with non-object items), but covers basic nested objects and arrays of objects.
 *
 * @param {(JSONSchema7 | undefined)} schema - JSON schema to convert, expected to be of type 'object' with properties
 * @param {string} parentPath - current path of the parent node, used for recursion to build full paths (start with empty string for root level)
 * @param {?JSONSchema7} [root] - root schema for resolving $ref, needed for correct type detection when schema has references
 * @returns {SchemaTreeNode[]} -  array of schema tree nodes with path, name, type, children, and optional dialMeta for first-level fields
 */
export const schemaToTreeNodes = (
  schema: JSONSchema7 | undefined,
  parentPath: string,
  root?: JSONSchema7,
): SchemaTreeNode[] => {
  if (!schema || !schema.properties) return [];
  const rootSchema = root ?? schema;

  const isFirstLevel = parentPath === '';

  return Object.entries(schema.properties).map(([name, def]) => {
    const resolvedDef = resolveDef(def, rootSchema);
    if (!isJSONSchema7(resolvedDef)) {
      return {
        path: parentPath ? `${parentPath}.${name}` : name,
        name,
        type: 'string' as JSONSchema7TypeName,
        children: [],
      };
    }

    const effectiveDef = getEffectiveSchema(def, rootSchema) ?? (resolvedDef as JSONSchema7);
    const type = getPrimaryType(effectiveDef);
    const path = parentPath ? `${parentPath}.${name}` : name;
    let children: SchemaTreeNode[] = [];

    if (type === 'object' && effectiveDef.properties) {
      children = schemaToTreeNodes(effectiveDef as JSONSchema7, path, rootSchema);
    } else if (
      type === 'array' &&
      effectiveDef.items &&
      !Array.isArray(effectiveDef.items) &&
      typeof effectiveDef.items === 'object' &&
      isJSONSchema7(effectiveDef.items as JSONSchema7Definition)
    ) {
      const items = effectiveDef.items as JSONSchema7;
      if (items.properties) {
        // Child paths through array use [0] index for JSONata (e.g. choices[0].message.content)
        children = schemaToTreeNodes(items, `${path}[0]`, rootSchema);
      }
    }

    const rawDef = isFirstLevel && typeof def === 'object' && def !== null ? (def as Record<string, unknown>) : null;
    const dialMeta =
      rawDef && typeof rawDef[DIAL_META_KEY] === 'object' && rawDef[DIAL_META_KEY] !== null
        ? (rawDef[DIAL_META_KEY] as Record<string, unknown>)
        : undefined;
    return { path, name, type, children, ...(dialMeta && Object.keys(dialMeta).length > 0 && { dialMeta }) };
  });
};
