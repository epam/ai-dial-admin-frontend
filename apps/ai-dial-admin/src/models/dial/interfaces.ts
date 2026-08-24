export enum DeploymentInterfaceType {
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
