import { decodeCorePath } from '@/src/server/publications/path';

/**
 * A deployment id in its decoded form, so an id still URI-encoded per segment (as Core stores a path)
 * compares equal to the same id written plain. An id that is not valid percent-encoding stays as it is.
 */
export const normalizeDeploymentId = (id: string): string => {
  try {
    return decodeCorePath(id);
  } catch {
    return id;
  }
};
