import { getPlatformApplication } from '@/src/app/[lang]/assets-applications/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { APPLICATIONS_PREFIX } from '@/src/constants/publications-core';
import { ApplicationRoute } from '@/src/types/routes';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';

/**
 * Platform-bucket applications and Entities applications both use `$type: dial-application` with a
 * bare deployment id. Prefer the platform application when Core has that resource; otherwise fall
 * back to Entities → Applications.
 */
export async function resolveApplicationDeploymentRoute(deploymentId: string): Promise<ApplicationRoute> {
  if (deploymentId.startsWith(APPLICATIONS_PREFIX)) {
    return ApplicationRoute.AssetsApplications;
  }

  try {
    const result = await getPlatformApplication(`${PLATFORM_ROOT_FOLDER}/${deploymentId}`, DEFAULT_ETAG);
    if (result?.response) {
      return ApplicationRoute.AssetsApplications;
    }
  } catch {
    // Platform miss → Entities Applications
  }

  return ApplicationRoute.Applications;
}
