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

// Mirrors Core's InterfaceMode: PASSTHROUGH (default when a saved interface has no `mode`) routes the
// request straight to `baseUrl`; TRANSLATOR routes it through a Translator first (see TranslatorReference).
export enum InterfaceMode {
  Passthrough = 'passthrough',
  Translator = 'translator',
}

// Mirrors Core's TranslatorRef: a bare string is a name resolved against the platform Translator
// registry; an object is an inline Translator definition. No `in` field — it's implicit from the
// interface type this reference is attached to.
export type TranslatorReference = string | { baseUrl: string; out: DeploymentInterfaceType };

export interface DialDeploymentInterface {
  baseUrl: string;
  // Added for type symmetry with DialResourceInterface (see DeploymentInterface.java) — no UI on the
  // admin-backend-owned surfaces (entity Models/Applications, Interceptors) reads or writes these yet.
  mode?: InterfaceMode;
  translator?: TranslatorReference;
  defaultHeaders?: Record<string, string>;
  defaults?: Record<string, unknown>;
  features?: Record<string, unknown>;
}

export interface DialResourceInterface {
  base_url: string;
  mode?: InterfaceMode;
  translator?: TranslatorReference;
  default_headers?: Record<string, string>;
  defaults?: Record<string, unknown>;
  features?: Record<string, unknown>;
}
