import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

export const MODEL_INTERFACE_TYPES: DeploymentInterfaceType[] = [
  DeploymentInterfaceType.OpenAIChatCompletions,
  DeploymentInterfaceType.OpenAIResponses,
  DeploymentInterfaceType.AnthropicMessages,
  DeploymentInterfaceType.OpenAIEmbeddings,
];

export const APPLICATION_INTERFACE_TYPES: DeploymentInterfaceType[] = [DeploymentInterfaceType.OpenAIChatCompletions];

export const INTERCEPTOR_INTERFACE_TYPES: DeploymentInterfaceType[] = [DeploymentInterfaceType.OpenAIChatCompletions];

export const ASSET_APPLICATION_INTERFACE_TYPES: DeploymentInterfaceType[] = [
  DeploymentInterfaceType.OpenAIChatCompletions,
];
