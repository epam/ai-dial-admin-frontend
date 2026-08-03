import { DeploymentInterfaceType, DialResourceInterface } from '@/src/models/dial/interfaces';

interface ResponsesCapable {
  interfaces?: Record<string, DialResourceInterface>;
  responsesEndpoint?: string;
}

/**
 * Mirrors DIAL Core's `Deployment.supportsInterface(OPENAI_RESPONSES)`: the interfaces map is the
 * current routing input and `responsesEndpoint` the legacy fallback, so declaring either means the
 * deployment can serve the Responses API. The entity surfaces derive this from `source.$type` instead,
 * which has no counterpart on a Core model resource.
 */
export const supportsResponsesInterface = (entity?: ResponsesCapable | null): boolean => {
  if (!entity) {
    return false;
  }

  const baseUrl = entity.interfaces?.[DeploymentInterfaceType.OpenAIResponses]?.base_url;

  return !!baseUrl || !!entity.responsesEndpoint;
};
