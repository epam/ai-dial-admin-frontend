export enum DeploymentInterfaceType {
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
