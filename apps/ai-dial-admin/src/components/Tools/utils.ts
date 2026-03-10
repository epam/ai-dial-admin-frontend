import { Tool } from '@/src/models/dial/toolset';
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
