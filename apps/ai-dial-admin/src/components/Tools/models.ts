import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialToolsetResource } from '@/src/models/dial/resource';
import { Tool, Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';

export type ToolsEntity = Toolset | DialApplication | DialToolsetResource;

export interface ToolsContextParams {
  view?: ApplicationRoute;
  originalEntity?: ToolsEntity;
  selectedEntity?: ToolsEntity;
  isAsset?: boolean;
  isMcpToolset?: boolean;
  isRunnerApplication?: boolean;
  disabled?: boolean;
  appRunner?: DialApplicationScheme;
}

export interface ToolsContext {
  isApplicationTools: boolean;
  isAssetToolset: boolean;
  isAssetApplication: boolean;
  isManagementVisible: boolean;
  toolSetName: string;
}

export interface ToolsDiscoveryParams {
  originalEntity?: ToolsEntity;
  selectedEntity?: ToolsEntity;
  isRunnerApplication?: boolean;
  isAsset?: boolean;
  isMcpToolset?: boolean;
  isApplicationTools: boolean;
  containerId?: string;
}

export interface ToolsDisplayParams {
  originalEntity?: ToolsEntity;
  selectedEntity?: ToolsEntity;
  tools: Tool[] | null;
  isApplicationTools: boolean;
  isAssetToolset: boolean;
  isMcpToolset?: boolean;
  isRunnerApplication?: boolean;
  appRunner?: DialApplicationScheme;
  onChangeEntity?: (entity: Toolset | DialApplication) => void;
}
