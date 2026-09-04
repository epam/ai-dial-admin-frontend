/**
 * DIAL Core's `InterfaceType` vocabulary, shared by the Core config `interfaces` map and by the
 * Evaluation Framework's reported `interfaces` array. Only a subset of these is configurable per
 * entity type — see the `*_INTERFACE_TYPES` allowlists in `@/src/constants/deployment-interfaces`.
 */
export enum DeploymentInterfaceType {
  Chat = 'chat',
  Embedding = 'embedding',
  Mcp = 'mcp',
  CustomUi = 'custom_ui',
  OpenAIChatCompletions = 'openaiChatCompletions',
  OpenAIResponses = 'openaiResponses',
  AnthropicMessages = 'anthropicMessages',
  OpenAIEmbeddings = 'openaiEmbeddings',
}

export interface DialDeploymentInterface {
  baseUrl: string;
}

export interface DialResourceInterface {
  base_url: string;
}
