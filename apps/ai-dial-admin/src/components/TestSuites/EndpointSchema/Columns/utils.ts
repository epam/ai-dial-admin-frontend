import { JSONSchema7 } from 'json-schema';

import { SchemaTreeNode, schemaToTreeNodes } from '@/src/components/Common/SchemaGrid/utils';
import { CategorizedFields, DocumentationRow } from './types';

const flattenNodes = (
  nodes: SchemaTreeNode[],
  result: { path: string; name: string; type: string }[] = [],
): { path: string; name: string; type: string }[] => {
  for (const node of nodes) {
    result.push({ path: node.path, name: node.name, type: node.type });
    if (node.children.length) {
      flattenNodes(node.children, result);
    }
  }
  return result;
};

const categorizeFields = (nodes: SchemaTreeNode[]): CategorizedFields => {
  const flat = flattenNodes(nodes);

  const simpleFields = nodes.filter((n) => n.type !== 'object' && n.type !== 'array');
  const objectFields = nodes.filter((n) => n.type === 'object');
  const arrayFields = nodes.filter((n) => n.type === 'array');
  const stringFields = flat.filter((n) => n.type === 'string');
  const numberFields = flat.filter((n) => n.type === 'number' || n.type === 'integer');
  const nestedPaths = flat.filter((n) => n.path.includes('.')).map((n) => ({ path: n.path, type: n.type }));

  return { simpleFields, objectFields, arrayFields, stringFields, numberFields, nestedPaths };
};

export const buildPathNavigationRows = (schema: JSONSchema7): DocumentationRow[] => {
  const nodes = schemaToTreeNodes(schema, '', schema);
  if (!nodes.length) return [];

  const { simpleFields, objectFields, nestedPaths } = categorizeFields(nodes);
  const rows: DocumentationRow[] = [];

  // Simple field access
  const firstSimple = simpleFields[0];
  if (firstSimple) {
    rows.push({
      useCase: 'Simple field',
      expression: firstSimple.path,
      resultType: firstSimple.type,
    });
  }

  // Second simple field for variety
  const secondSimple = simpleFields[1];
  if (secondSimple) {
    rows.push({
      useCase: 'Another top-level field',
      expression: secondSimple.path,
      resultType: secondSimple.type,
    });
  }

  // Nested field access
  const firstNested = nestedPaths[0];
  if (firstNested) {
    rows.push({
      useCase: 'Nested field',
      expression: firstNested.path,
      resultType: firstNested.type,
    });
  }

  // Deep nested path
  const deepNested = nestedPaths.find((n) => n.path.split('.').length > 2);
  if (deepNested) {
    rows.push({
      useCase: 'Deep nested path',
      expression: deepNested.path,
      resultType: deepNested.type,
    });
  }

  // Object access
  const firstObject = objectFields[0];
  if (firstObject) {
    rows.push({
      useCase: 'Object field',
      expression: firstObject.path,
      resultType: 'object',
    });
  }

  return rows;
};

export const buildArrayOperationsRows = (schema: JSONSchema7): DocumentationRow[] => {
  const nodes = schemaToTreeNodes(schema, '', schema);
  if (!nodes.length) return [];

  const { arrayFields } = categorizeFields(nodes);
  const rows: DocumentationRow[] = [];

  const firstArray = arrayFields[0];
  if (!firstArray) return rows;

  // Array element by index
  rows.push({
    useCase: 'First element',
    expression: `${firstArray.path}[0]`,
    resultType: firstArray.children.length ? 'object' : 'any',
  });

  // Map/project a field from array items
  const firstChild = firstArray.children[0];
  if (firstChild) {
    rows.push({
      useCase: 'Map field from items',
      expression: `${firstArray.path}.${firstChild.name}`,
      resultType: `${firstChild.type}[]`,
    });
  }

  // Count elements
  rows.push({
    useCase: 'Count elements',
    expression: `$count(${firstArray.path})`,
    resultType: 'number',
  });

  // Filter predicate
  const filterChild = firstArray.children.find((c) => c.type === 'string') ?? firstChild;
  if (filterChild) {
    rows.push({
      useCase: 'Filter (predicate)',
      expression: `${firstArray.path}[${filterChild.name}='value']`,
      resultType: 'array',
    });
  }

  // Second array if available
  const secondArray = arrayFields[1];
  if (secondArray) {
    rows.push({
      useCase: 'Another array access',
      expression: `${secondArray.path}[0]`,
      resultType: secondArray.children.length ? 'object' : 'any',
    });
  }

  return rows;
};

export const buildConditionalsRows = (schema: JSONSchema7): DocumentationRow[] => {
  const nodes = schemaToTreeNodes(schema, '', schema);
  if (!nodes.length) return [];

  const { simpleFields, arrayFields, stringFields, numberFields } = categorizeFields(nodes);
  const rows: DocumentationRow[] = [];

  // Ternary / conditional
  const strField = stringFields[0];
  if (strField) {
    rows.push({
      useCase: 'Conditional (ternary)',
      expression: `${strField.path} ? ${strField.path} : 'N/A'`,
      resultType: 'string',
    });
  }

  // Null safety with default
  const field = simpleFields[0];
  if (field) {
    rows.push({
      useCase: 'Default if missing',
      expression: `$exists(${field.path}) ? ${field.path} : null`,
      resultType: field.type,
    });
  }

  // Numeric comparison
  const numField = numberFields[0];
  if (numField) {
    rows.push({
      useCase: 'Numeric comparison',
      expression: `${numField.path} > 0 ? 'positive' : 'zero or negative'`,
      resultType: 'string',
    });
  }

  // Array empty check
  const arrField = arrayFields[0];
  if (arrField) {
    rows.push({
      useCase: 'Empty array check',
      expression: `$count(${arrField.path}) > 0 ? ${arrField.path} : []`,
      resultType: 'array',
    });
  }

  // Existence check
  const secondField = simpleFields[1] ?? field;
  if (secondField) {
    rows.push({
      useCase: 'Existence check',
      expression: `$exists(${secondField.path})`,
      resultType: 'boolean',
    });
  }

  return rows;
};

export const buildMathStringRows = (schema: JSONSchema7): DocumentationRow[] => {
  const nodes = schemaToTreeNodes(schema, '', schema);
  if (!nodes.length) return [];

  const { arrayFields, stringFields, numberFields } = categorizeFields(nodes);
  const rows: DocumentationRow[] = [];

  // String functions
  const strField = stringFields[0];
  if (strField) {
    rows.push({
      useCase: 'String length',
      expression: `$length(${strField.path})`,
      resultType: 'number',
    });
    rows.push({
      useCase: 'Uppercase',
      expression: `$uppercase(${strField.path})`,
      resultType: 'string',
    });
    rows.push({
      useCase: 'Substring',
      expression: `$substring(${strField.path}, 0, 10)`,
      resultType: 'string',
    });
  }

  // Numeric math
  const numField = numberFields[0];
  if (numField) {
    rows.push({
      useCase: 'Round number',
      expression: `$round(${numField.path}, 2)`,
      resultType: 'number',
    });
  }

  // Array math — sum / average
  const numArrayChild = arrayFields
    .flatMap((a) => a.children.filter((c) => c.type === 'number' || c.type === 'integer'))
    .at(0);
  const parentArray = arrayFields.find((a) => a.children.some((c) => c === numArrayChild));
  if (numArrayChild && parentArray) {
    rows.push({
      useCase: 'Sum array values',
      expression: `$sum(${parentArray.path}.${numArrayChild.name})`,
      resultType: 'number',
    });
    rows.push({
      useCase: 'Average array values',
      expression: `$average(${parentArray.path}.${numArrayChild.name})`,
      resultType: 'number',
    });
  }

  // Type conversion
  if (numField) {
    rows.push({
      useCase: 'Number to string',
      expression: `$string(${numField.path})`,
      resultType: 'string',
    });
  } else if (strField) {
    rows.push({
      useCase: 'String concatenation',
      expression: `$join([${strField.path}, ' suffix'])`,
      resultType: 'string',
    });
  }

  return rows;
};
