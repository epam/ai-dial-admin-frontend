import { JSONSchema7, JSONSchema7Definition, JSONSchema7TypeName } from 'json-schema';

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
}

const SCHEMA_TYPES: JSONSchema7TypeName[] = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'];

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

export const jsonSchemaToFields = (schema: JSONSchema7 | undefined): SchemaFieldRow[] => {
  if (!schema || schema.type !== 'object' || !schema.properties) return [];

  const requiredFields = schema.required || [];

  return Object.entries(schema.properties).map(([name, def]) => {
    if (!isJSONSchema7(def)) {
      return {
        ...createEmptyField(null, 0),
        name,
      };
    }

    const type = (def.type as JSONSchema7TypeName) || 'string';
    const field: SchemaFieldRow = {
      id: generateFieldId(),
      name,
      type,
      required: requiredFields.includes(name),
      description: def.description || '',
      expanded: false,
      children: [],
      parentId: null,
      depth: 0,
    };

    if (type === 'object' && def.properties) {
      const nestedRequired = def.required || [];
      field.children = Object.entries(def.properties).map(([childName, childDef]) => {
        if (!isJSONSchema7(childDef)) {
          return { ...createEmptyField(field.id, 1), name: childName };
        }
        return {
          id: generateFieldId(),
          name: childName,
          type: (childDef.type as JSONSchema7TypeName) || 'string',
          required: nestedRequired.includes(childName),
          description: childDef.description || '',
          expanded: false,
          children: [],
          parentId: field.id,
          depth: 1,
        };
      });
      if (field.children.length) field.expanded = true;
    } else if (
      type === 'array' &&
      def.items &&
      !Array.isArray(def.items) &&
      typeof def.items === 'object' &&
      isJSONSchema7(def.items as JSONSchema7Definition) &&
      (def.items as JSONSchema7).properties
    ) {
      const items = def.items as JSONSchema7;
      const nestedRequired = items.required || [];
      field.children = Object.entries(items.properties!).map(([childName, childDef]) => {
        if (!isJSONSchema7(childDef)) {
          return { ...createEmptyField(field.id, 1), name: childName };
        }
        return {
          id: generateFieldId(),
          name: childName,
          type: (childDef.type as JSONSchema7TypeName) || 'string',
          required: nestedRequired.includes(childName),
          description: childDef.description || '',
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
    const prop: JSONSchema7 = { type: field.type };

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

    schema.properties![fieldName] = prop;
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

export const flattenFields = (fields: SchemaFieldRow[], depth = 0): SchemaFieldRow[] => {
  const result: SchemaFieldRow[] = [];

  fields.forEach((field) => {
    result.push({ ...field, depth });

    if ((field.type === 'object' || field.type === 'array') && field.expanded) {
      if (field.children?.length) {
        result.push(...flattenFields(field.children, depth + 1));
      }
      // "add sub-field" placeholder row
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
  });

  // "add field" placeholder row at root level
  if (depth === 0) {
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
