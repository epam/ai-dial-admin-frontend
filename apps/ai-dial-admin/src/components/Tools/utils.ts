import { ToolsContext, ToolsContextParams } from '@/src/components/Tools/models';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { Tool } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { ToolFilter } from './type';

export const getToolsContext = ({
  view,
  originalEntity,
  selectedEntity,
  isAsset,
  isMcpToolset,
  isRunnerApplication,
  disabled,
  appRunner,
}: ToolsContextParams): ToolsContext => {
  const isApplicationTools = view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications;
  const savedAssetPath = (originalEntity as AssetToolset | undefined)?._metadata?.path;
  const selectedToolSetName = isAsset ? (selectedEntity as AssetToolset)?._metadata?.path : selectedEntity?.name;

  return {
    isApplicationTools,
    isAssetToolset: !!isAsset && !isApplicationTools,
    isAssetApplication: !!isAsset && !!savedAssetPath,
    isManagementVisible: !disabled && !isMcpToolset && !appRunner && !isRunnerApplication,
    toolSetName: isRunnerApplication ? (savedAssetPath ?? originalEntity?.name ?? '') : selectedToolSetName || '',
  };
};

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

export const getAllTools = (
  useAllTools: boolean,
  allToolNames: string[],
  isAppRunner: boolean,
  runnerTools: string[],
  allowedTools: string[],
): string[] => {
  if (useAllTools) {
    return allToolNames;
  }

  if (isAppRunner) {
    return runnerTools.length ? runnerTools : allToolNames;
  }

  return allowedTools;
};
