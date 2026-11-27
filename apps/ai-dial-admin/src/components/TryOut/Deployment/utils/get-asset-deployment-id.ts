import { APPLICATIONS_PREFIX } from '@/src/constants/publications-core';

const PLATFORM_BUCKET_PREFIX = 'platform/';

interface AssetEntity {
  name?: string;
  _metadata?: { path?: string };
}

/**
 * The id Core calls an application by. Core keys a platform application, like a config-file one, by its short name;
 * an application stored in another bucket is called by its resource url, the `applications/` prefix and the
 * bucket-qualified path. A platform resource url is not a name Core resolves for the admin, so it is never used.
 */
export const getAssetApplicationDeploymentId = (app: AssetEntity): string => {
  const path = app._metadata?.path;
  if (!path || path.startsWith(PLATFORM_BUCKET_PREFIX)) {
    return app.name ?? path?.slice(PLATFORM_BUCKET_PREFIX.length) ?? '';
  }

  return `${APPLICATIONS_PREFIX}${path}`;
};

/** A platform model is called by its short name, the key Core holds it under. */
export const getPlatformModelDeploymentId = (name: string): string => name;
