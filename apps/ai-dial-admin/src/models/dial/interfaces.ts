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

// Which field shape InterfacesField renders per row: a single base_url (deployment-side routing) or
// the fuller endpoint/key/extraData override set (upstream-side, peer of DialModelEndpoint's own fields).
export enum InterfaceFieldVariant {
  BaseUrl = 'baseUrl',
  Endpoint = 'endpoint',
}

export interface DialDeploymentInterface {
  baseUrl: string;
}

export interface DialResourceInterface {
  base_url: string;
}
