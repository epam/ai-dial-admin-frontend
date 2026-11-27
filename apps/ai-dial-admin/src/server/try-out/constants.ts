import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { encodeCorePath } from '@/src/server/publications/path';

export const CORE_CHAT_COMPLETIONS_PATH = (deployment: string) =>
  `/openai/deployments/${encodeCorePath(deployment)}/chat/completions`;

export const CORE_EMBEDDINGS_PATH = (deployment: string) =>
  `/openai/deployments/${encodeCorePath(deployment)}/embeddings`;

/** Where each supported interface is served on Core. The caller never supplies a path. */
export const CORE_INTERFACE_PATHS: Partial<Record<DeploymentInterfaceType, (deployment: string) => string>> = {
  [DeploymentInterfaceType.OpenAIChatCompletions]: CORE_CHAT_COMPLETIONS_PATH,
  [DeploymentInterfaceType.OpenAIResponses]: () => '/openai/v1/responses',
  [DeploymentInterfaceType.AnthropicMessages]: () => '/anthropic/v1/messages',
  [DeploymentInterfaceType.OpenAIEmbeddings]: CORE_EMBEDDINGS_PATH,
};

/**
 * Request headers the caller may not set: the credentials (Core reads a key from `api-key` and `x-api-key` as well
 * as `authorization`, so all are ours to set), connection handling, and what fetch computes itself.
 */
export const BLOCKED_REQUEST_HEADERS = new Set([
  'accept-encoding',
  'api-key',
  'authorization',
  'connection',
  'content-length',
  'cookie',
  'host',
  'keep-alive',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'x-api-key',
]);

export const TRY_OUT_TIMEOUT_MS = 5 * 60 * 1000;
