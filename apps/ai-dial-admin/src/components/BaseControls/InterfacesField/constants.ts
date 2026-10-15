import { OverridePathOperation } from '@/src/components/BaseControls/InterfacesField/models';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

// Mirrors Core's InterfacePathMapping: the operation keys an `overridePaths` map accepts, per owning
// interface type. Core rejects a known key under another interface, and `{id}` on an operation
// that has no id to render (isIdApplicable false).
export const OVERRIDE_PATH_OPERATIONS: Record<DeploymentInterfaceType, OverridePathOperation[]> = {
  [DeploymentInterfaceType.OpenAIChatCompletions]: [
    {
      key: 'postAzureOpenaiChatCompletions',
      defaultPath: '/openai/deployments/{id}/chat/completions',
      isIdApplicable: true,
    },
  ],
  [DeploymentInterfaceType.OpenAIEmbeddings]: [
    { key: 'postAzureOpenaiEmbeddings', defaultPath: '/openai/deployments/{id}/embeddings', isIdApplicable: true },
  ],
  [DeploymentInterfaceType.OpenAIResponses]: [
    { key: 'postOpenaiResponses', defaultPath: '/openai/v1/responses', isIdApplicable: false },
    { key: 'getOpenaiResponsesById', defaultPath: '/openai/v1/responses/{id}', isIdApplicable: true },
    { key: 'deleteOpenaiResponsesById', defaultPath: '/openai/v1/responses/{id}', isIdApplicable: true },
    { key: 'postOpenaiResponsesCancel', defaultPath: '/openai/v1/responses/{id}/cancel', isIdApplicable: true },
  ],
  [DeploymentInterfaceType.AnthropicMessages]: [
    { key: 'postAnthropicMessages', defaultPath: '/anthropic/v1/messages', isIdApplicable: false },
    {
      key: 'postAnthropicMessagesCountTokens',
      defaultPath: '/anthropic/v1/messages/count_tokens',
      isIdApplicable: false,
    },
  ],
};
