import { BaseApi } from '@/src/server/base-api';
import { ErrorObject } from '@/src/utils/api/error';
import { normalizeCoreError } from './error';

/**
 * Base client for calling DIAL Core directly (instead of the admin backend).
 *
 * Reuses the shared request pipeline and JWT-Bearer auth from {@link BaseApi};
 * the host is `DIAL_CORE_API_URL`. The only behavioral difference is error
 * normalization (R3/D9): Core returns plain-text or nested error bodies that the
 * admin backend used to flatten, so we reproduce that flattening here.
 */
export class CoreApi extends BaseApi {
  protected parseErrorBody(error: string, status: number): ErrorObject {
    return normalizeCoreError(error, status);
  }
}
