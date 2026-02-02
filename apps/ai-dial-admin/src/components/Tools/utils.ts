import { BasicI18nKey } from '@/src/constants/i18n';
import { Tool, ToolSchema } from '@/src/models/dial/toolset';
import { ToolFilter } from './type';

export const getFilteredTools = (tools: string[], selectedFilters: ToolFilter[], availableTools: Tool[]) => {
  const filteredTools: string[] = [];
  const availableToolsKeys = availableTools.map((t) => t.name);
  const availableToolsSet = new Set(availableToolsKeys);
  const customTools = tools.reduce((acc: Tool[], item) => {
    if (!availableToolsSet.has(item)) acc.push({ name: item });
    return acc;
  }, []);

  if (selectedFilters.includes(ToolFilter.AutoDetected)) {
    filteredTools.push(...availableToolsKeys.filter((t) => tools.includes(t)));
  }

  if (selectedFilters.includes(ToolFilter.AddedManually)) {
    filteredTools.push(...tools.filter((t) => !availableTools.some((a) => a.name === t)));
  }

  return [...availableTools, ...customTools].filter((t) => filteredTools.includes(t.name));
};

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

export const formatRequired = (value: string, t: (stringToTranslate: string) => string) => {
  return value ? t(BasicI18nKey.Yes) : t(BasicI18nKey.No);
};
