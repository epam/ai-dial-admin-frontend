import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

/** `interface` query value narrowing a deployment listing to MCP servers. */
export const MCP_INTERFACE_FILTER = 'mcp';

export const MODEL_INTERFACE_TYPES: DeploymentInterfaceType[] = [
  DeploymentInterfaceType.OpenAIChatCompletions,
  DeploymentInterfaceType.OpenAIResponses,
  DeploymentInterfaceType.AnthropicMessages,
  DeploymentInterfaceType.OpenAIEmbeddings,
];

export const ROUTER_INTERFACE_TYPES: DeploymentInterfaceType[] = MODEL_INTERFACE_TYPES;

export const APPLICATION_INTERFACE_TYPES: DeploymentInterfaceType[] = [DeploymentInterfaceType.OpenAIChatCompletions];

export const ASSET_APPLICATION_INTERFACE_TYPES: DeploymentInterfaceType[] = [
  DeploymentInterfaceType.OpenAIChatCompletions,
];

export const INTERCEPTOR_INTERFACE_TYPES: DeploymentInterfaceType[] = [DeploymentInterfaceType.OpenAIChatCompletions];
