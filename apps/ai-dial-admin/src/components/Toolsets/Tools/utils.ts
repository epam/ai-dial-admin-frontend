import { uniq } from 'lodash';
import { ToolFilter } from './type';

export const getFilteredTools = (tools: string[], selectedFilters: ToolFilter[], availableTools: string[]) => {
  const filteredTools: string[] = [];
  if (selectedFilters.includes(ToolFilter.Enabled)) {
    filteredTools.push(...availableTools.filter((t) => tools.includes(t)));
  }

  if (selectedFilters.includes(ToolFilter.Disabled)) {
    filteredTools.push(...availableTools.filter((t) => !tools.includes(t)));
  }

  if (selectedFilters.includes(ToolFilter.AutoDetected)) {
    filteredTools.push(...availableTools);
  }

  if (selectedFilters.includes(ToolFilter.AddedManually)) {
    filteredTools.push(...tools.filter((t) => !availableTools.includes(t)));
  }

  return uniq(filteredTools);
};
