import { getModel } from '@/src/app/[lang]/platform-models/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { MODELS_PREFIX } from '@/src/constants/publications-core';
import { ApplicationRoute } from '@/src/types/routes';

/** Bare name used in `/platform-models/{name}` and `/models/{name}` URL segments. */
export const getModelNavigationName = (deploymentId: string): string =>
  deploymentId.startsWith(MODELS_PREFIX) ? deploymentId.slice(MODELS_PREFIX.length) : deploymentId;

/**
 * Catalog (Core platform-bucket) models and Entities models both use `$type: dial-model` with a bare
 * deployment id. Prefer Catalog when Core has a platform model resource for that id; otherwise fall
 * back to Entities → Models.
 */
export async function resolveModelDeploymentRoute(deploymentId: string): Promise<ApplicationRoute> {
  if (deploymentId.startsWith(MODELS_PREFIX)) {
    return ApplicationRoute.PlatformModels;
  }

  const name = getModelNavigationName(deploymentId);
  try {
    const result = await getModel(name, DEFAULT_ETAG);
    if (result?.response) {
      return ApplicationRoute.PlatformModels;
    }
  } catch {
    // Platform miss → Entities Models
  }

  return ApplicationRoute.Models;
}
