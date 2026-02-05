import { ToolSchema } from '@/src/models/dial/toolset';

export const convertSchemaToTable = (schema?: ToolSchema) => {
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
