import { MODELS_PREFIX } from '@/src/constants/publications-core';

const APPLICATIONS_PREFIX = 'applications/';

interface AssetEntity {
  name?: string;
  _metadata?: { path?: string };
}

/**
 * The id Core calls an application by. Core names one stored as a resource by its resource url, which is the
 * `applications/` prefix and the bucket-qualified path; one with no Core path, such as a config-file application,
 * is called by its name.
 */
export const getAssetApplicationDeploymentId = (app: AssetEntity): string =>
  app._metadata?.path ? `${APPLICATIONS_PREFIX}${app._metadata.path}` : (app.name ?? '');

/** A platform model is called by the canonical id Core keys it under, `models/platform/<name>`. */
export const getPlatformModelDeploymentId = (name: string): string => `${MODELS_PREFIX}${name}`;
