/**
 * The APIs a deployment declares support for, as reported in `Deployment.interfaces`. Read-only and
 * authoritative: a deployment serves an API listed here and no other.
 *
 * Distinct from `DeploymentInterfaceType`, which is the *configurable* map keying an interface to a
 * base URL. Three values coincide, but the two are different fields with different lifecycles — one
 * is edited here, the other is declared by the deployment.
 */
export enum DeploymentApiInterface {
  Chat = 'chat',
  OpenAIChatCompletions = 'openaiChatCompletions',
  OpenAIResponses = 'openaiResponses',
  AnthropicMessages = 'anthropicMessages',
}

/**
 * Interfaces configurable per entity through the Core config `interfaces` map. Which of these an
 * entity type may declare is set by the `*_INTERFACE_TYPES` allowlists in
 * `@/src/constants/deployment-interfaces`; every member carries a label in `InterfacesField`.
 */
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
