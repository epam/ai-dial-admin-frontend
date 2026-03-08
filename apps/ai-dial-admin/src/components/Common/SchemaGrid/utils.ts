import { JSONSchema7, JSONSchema7Definition, JSONSchema7TypeName } from 'json-schema';

import { resolveRef } from '@/src/utils/schema';

export interface SchemaFieldRow {
  id: string;
  name: string;
  type: JSONSchema7TypeName;
  required: boolean;
  description: string;
  expanded: boolean;
  children: SchemaFieldRow[];
  parentId: string | null;
  depth: number;
  isAddSubFieldRow?: boolean;
  /** Value of dial:meta from schema (first-level only). Stored as-is, e.g. { "dial:propertyKind": "server", "dial:propertyOrder": 1 }. */
  dialMeta?: Record<string, unknown>;
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

export const getSchemaTypes = (): JSONSchema7TypeName[] => SCHEMA_TYPES;

let nextId = 0;
export const generateFieldId = (): string => `schema-field-${++nextId}`;

export const createEmptyField = (parentId: string | null = null, depth = 0): SchemaFieldRow => ({
  id: generateFieldId(),
  name: '',
  type: 'string',
  required: false,
  description: '',
  expanded: false,
  children: [],
  parentId,
  depth,
});

const isJSONSchema7 = (def: JSONSchema7Definition): def is JSONSchema7 => typeof def === 'object';

export const getGridSchemaPart = (
  s: JSONSchema7 | undefined,
): Pick<JSONSchema7, 'type' | 'properties' | 'required'> | undefined => {
  if (!s) return undefined;
  return { type: s.type, properties: s.properties, required: s.required };
};

export const resolveDef = (def: JSONSchema7Definition, root: JSONSchema7): JSONSchema7Definition => {
  if (typeof def !== 'object' || !def || !('$ref' in def) || !def.$ref) return def;
  const resolved = resolveRef(root, def.$ref);
  return resolved ?? def;
};

export const isNullOnly = (schema: JSONSchema7): boolean => {
  if (schema.type === 'null') {
    return true;
  }
  if (Array.isArray(schema.type) && schema.type.length === 1 && schema.type[0] === 'null') {
    return true;
  }
  return false;
};

export const getEffectiveSchema = (def: JSONSchema7Definition, root: JSONSchema7): JSONSchema7 | null => {
  if (typeof def !== 'object' || !def) {
    return null;
  }
  let current = resolveDef(def, root);
  if (typeof current !== 'object' || !current) {
    return null;
  }
  current = current as JSONSchema7;
  const variants = current.anyOf ?? current.oneOf;
  if (Array.isArray(variants) && variants.length > 0) {
    const chosen = variants.find((v) => {
      if (typeof v !== 'object' || !v) return false;
      const r = resolveDef(v, root) as JSONSchema7;
      return !isNullOnly(r);
    });
    const variant = chosen ?? variants[0];
    if (typeof variant === 'object' && variant) {
      const resolved = resolveDef(variant, root) as JSONSchema7;
      return resolved ?? null;
    }
  }
  return current;
};

/** Get the primary type from a schema (handles type as string or array, e.g. ['string','null']). */
function getPrimaryType(schema: JSONSchema7): JSONSchema7TypeName {
  const type = schema.type;
  if (typeof type === 'string') {
    return type as JSONSchema7TypeName;
  }
  if (Array.isArray(type) && type.length) {
    const first = type.find((x) => x !== 'null') ?? type[0];
    return first as JSONSchema7TypeName;
  }
  return 'string';
}

export const jsonSchemaToFields = (schema: JSONSchema7 | undefined, root?: JSONSchema7): SchemaFieldRow[] => {
  if (!schema || schema.type !== 'object' || !schema.properties) return [];
  const rootSchema = root ?? schema;
  const requiredFields = schema.required || [];

  return Object.entries(schema.properties).map(([name, def]) => {
    const resolvedDef = resolveDef(def, rootSchema);
    if (!isJSONSchema7(resolvedDef)) {
      return {
        ...createEmptyField(null, 0),
        name,
      };
    }

    const effectiveDef = getEffectiveSchema(def, rootSchema) ?? (resolvedDef as JSONSchema7);
    const type = getPrimaryType(effectiveDef);
    const rawDef = typeof def === 'object' && def !== null ? (def as Record<string, unknown>) : null;
    const dialMeta =
      rawDef && typeof rawDef[DIAL_META_KEY] === 'object' && rawDef[DIAL_META_KEY] !== null
        ? (rawDef[DIAL_META_KEY] as Record<string, unknown>)
        : undefined;
    const field: SchemaFieldRow = {
      id: generateFieldId(),
      name,
      type,
      required: requiredFields.includes(name),
      description: effectiveDef.description || resolvedDef.description || '',
      expanded: false,
      children: [],
      parentId: null,
      depth: 0,
      ...(dialMeta && Object.keys(dialMeta).length > 0 && { dialMeta }),
    };

    if (type === 'object' && effectiveDef.properties) {
      const nestedRequired = effectiveDef.required || [];
      field.children = Object.entries(effectiveDef.properties).map(([childName, childDef]) => {
        const effectiveChild = getEffectiveSchema(childDef, rootSchema) ?? resolveDef(childDef, rootSchema);
        if (!isJSONSchema7(effectiveChild)) {
          return { ...createEmptyField(field.id, 1), name: childName };
        }
        const childSchema = effectiveChild as JSONSchema7;
        const childType = getPrimaryType(childSchema);
        return {
          id: generateFieldId(),
          name: childName,
          type: childType,
          required: nestedRequired.includes(childName),
          description: childSchema.description || '',
          expanded: false,
          children: [],
          parentId: field.id,
          depth: 1,
        };
      });
      if (field.children.length) field.expanded = true;
    } else if (
      type === 'array' &&
      effectiveDef.items &&
      !Array.isArray(effectiveDef.items) &&
      typeof effectiveDef.items === 'object' &&
      isJSONSchema7(effectiveDef.items as JSONSchema7Definition) &&
      (effectiveDef.items as JSONSchema7).properties
    ) {
      const items = effectiveDef.items as JSONSchema7;
      const nestedRequired = items.required || [];
      field.children = Object.entries(items.properties!).map(([childName, childDef]) => {
        const effectiveChild = getEffectiveSchema(childDef, rootSchema) ?? resolveDef(childDef, rootSchema);
        if (!isJSONSchema7(effectiveChild)) {
          return { ...createEmptyField(field.id, 1), name: childName };
        }
        const childSchema = effectiveChild as JSONSchema7;
        const childType = getPrimaryType(childSchema);
        return {
          id: generateFieldId(),
          name: childName,
          type: childType,
          required: nestedRequired.includes(childName),
          description: childSchema.description || '',
          expanded: false,
          children: [],
          parentId: field.id,
          depth: 1,
        };
      });
      if (field.children.length) field.expanded = true;
    }

    return field;
  });
};

export const fieldsToJsonSchema = (fields: SchemaFieldRow[]): JSONSchema7 => {
  const schema: JSONSchema7 = { type: 'object', properties: {}, required: [] };

  fields.forEach((field) => {
    const fieldName = field.name;
    const prop: JSONSchema7 & Record<string, unknown> = { type: field.type };

    if (field.description) {
      prop.description = field.description;
    }

    if ((field.type === 'object' || field.type === 'array') && field.children?.length) {
      if (field.type === 'object') {
        const nested = fieldChildrenToObjectSchema(field.children);
        prop.properties = nested.properties;
        if (nested.required?.length) prop.required = nested.required;
      } else {
        const items = fieldChildrenToObjectSchema(field.children);
        prop.items = items;
      }
    }

    if (field.parentId === null && field.dialMeta) {
      prop[DIAL_META_KEY] = field.dialMeta;
    }

    schema.properties![fieldName] = prop as JSONSchema7;
    if (field.required) (schema.required as string[]).push(fieldName);
  });

  if (!(schema.required as string[])?.length) delete schema.required;

  return schema;
};

const fieldChildrenToObjectSchema = (children: SchemaFieldRow[]): JSONSchema7 => {
  const schema: JSONSchema7 = { type: 'object', properties: {} };
  const requiredList: string[] = [];

  children.forEach((child) => {
    const childName = child.name;
    const childProp: JSONSchema7 = { type: child.type };
    if (child.description) childProp.description = child.description;

    if ((child.type === 'object' || child.type === 'array') && child.children?.length) {
      if (child.type === 'object') {
        const nested = fieldChildrenToObjectSchema(child.children);
        childProp.properties = nested.properties;
        if (nested.required?.length) childProp.required = nested.required;
      } else {
        childProp.items = fieldChildrenToObjectSchema(child.children);
      }
    }

    schema.properties![childName] = childProp;
    if (child.required) requiredList.push(childName);
  });

  if (requiredList.length) schema.required = requiredList;

  return schema;
};

export const flattenFields = (fields: SchemaFieldRow[], depth = 0, isReadonly?: boolean): SchemaFieldRow[] => {
  const result: SchemaFieldRow[] = [];

  fields.forEach((field) => {
    result.push({ ...field, depth });

    if ((field.type === 'object' || field.type === 'array') && field.expanded) {
      if (field.children?.length) {
        result.push(...flattenFields(field.children, depth + 1, isReadonly));
      }
      if (!isReadonly) {
        result.push({
          id: `add-sub-${field.id}`,
          name: '',
          type: 'string',
          required: false,
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
