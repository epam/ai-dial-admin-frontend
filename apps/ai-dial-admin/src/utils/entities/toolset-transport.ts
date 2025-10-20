import { ToolsetTransport } from '@/src/types/toolset';
import { AssetToolset } from '../../models/dial/deployment-asset';
import { Toolset } from '../../models/dial/toolset';

export const getTransport = (toolset: AssetToolset | Toolset) => {
  return toolset.endpoint?.includes('http') || toolset.endpoint?.includes('https')
    ? ToolsetTransport.HTTP
    : ToolsetTransport.SSE;
};

export const getAllowTools = (toolset: AssetToolset | Toolset) => {
  return toolset.allowedTools?.filter((tool) => tool !== '');
};
