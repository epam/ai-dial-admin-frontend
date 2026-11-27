import { MESSAGES_DEFAULT_MAX_TOKENS } from '@/src/components/TryOut/Deployment/constants';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

/**
 * The request body Simple mode sends for `message`. Chat completions and embeddings name the deployment in the
 * path; Responses and Messages name it in the body. Every body but embeddings asks for a streamed reply.
 */
export const buildTryOutBody = (
  type: DeploymentInterfaceType,
  deployment: string,
  message: string,
): Record<string, unknown> => {
  switch (type) {
    case DeploymentInterfaceType.OpenAIEmbeddings:
      return { input: message };
    case DeploymentInterfaceType.OpenAIResponses:
      return { model: deployment, input: message, stream: true };
    case DeploymentInterfaceType.AnthropicMessages:
      return {
        model: deployment,
        max_tokens: MESSAGES_DEFAULT_MAX_TOKENS,
        messages: [{ role: 'user', content: message }],
        stream: true,
      };
    default:
      return { messages: [{ role: 'user', content: message }], stream: true };
  }
};
