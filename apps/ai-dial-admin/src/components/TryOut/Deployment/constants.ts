import { DeploymentTryOutI18nKey } from '@/src/constants/i18n';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

/** The interfaces Try out can call, in the order they are offered. Embeddings is deliberately absent. */
export const TRY_OUT_INTERFACES: DeploymentInterfaceType[] = [
  DeploymentInterfaceType.OpenAIChatCompletions,
  DeploymentInterfaceType.OpenAIResponses,
  DeploymentInterfaceType.AnthropicMessages,
];

/**
 * How Core names, in a deployment's reported `interfaces`, what Try out can call. Core reports `chat` for a
 * deployment that serves chat completions through its legacy endpoint and `openaiChatCompletions` for one that
 * declares the interface.
 */
export const REPORTED_INTERFACE_TYPES: Record<string, DeploymentInterfaceType> = {
  chat: DeploymentInterfaceType.OpenAIChatCompletions,
  [DeploymentInterfaceType.OpenAIChatCompletions]: DeploymentInterfaceType.OpenAIChatCompletions,
  [DeploymentInterfaceType.OpenAIResponses]: DeploymentInterfaceType.OpenAIResponses,
  [DeploymentInterfaceType.AnthropicMessages]: DeploymentInterfaceType.AnthropicMessages,
};

export const TRY_OUT_INTERFACE_LABELS: Partial<Record<DeploymentInterfaceType, DeploymentTryOutI18nKey>> = {
  [DeploymentInterfaceType.OpenAIChatCompletions]: DeploymentTryOutI18nKey.InterfaceChatCompletions,
  [DeploymentInterfaceType.OpenAIResponses]: DeploymentTryOutI18nKey.InterfaceResponses,
  [DeploymentInterfaceType.AnthropicMessages]: DeploymentTryOutI18nKey.InterfaceMessages,
};

/** Anthropic's Messages API requires a token ceiling on every request. */
export const MESSAGES_DEFAULT_MAX_TOKENS = 1024;

/** Set on a route response that carries Core's answer and a Grafana link to its trace. */
export const TRY_OUT_TRACE_URL_HEADER = 'x-try-out-trace-url';
/** Set on a route response the route produced itself, so it is not mistaken for Core's own status. */
export const TRY_OUT_PROXY_ERROR_HEADER = 'x-try-out-proxy-error';
