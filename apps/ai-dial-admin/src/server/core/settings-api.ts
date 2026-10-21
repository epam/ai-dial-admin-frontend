import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { GlobalSettings } from '@/src/models/system-properties';
import { CoreApi } from './core-api';

/**
 * Core's global-settings singleton. Addressed on the entity URL rather than through a listing:
 * `ConfigResourceMetadataController` answers 405 for this type, because a singleton has no
 * collection to enumerate.
 */
const CORE_GLOBAL_SETTINGS_URL = 'v1/settings/platform/global';

export class SettingsApi extends CoreApi {
  /** Reads the API-written settings blob. A 404 means no override exists, not an error. */
  globalSettings(token: Token): Promise<ServerActionResponse> {
    return this.getAction(CORE_GLOBAL_SETTINGS_URL, token);
  }

  /** Same singleton as {@link globalSettings}, conditional on `etag` — backs the System Properties page. */
  getSystemProperties(token: Token, etag: string): Promise<ServerActionResponse<GlobalSettings>> {
    return this.getActionWithEtag(CORE_GLOBAL_SETTINGS_URL, etag, token);
  }

  /**
   * `etag` undefined means the prior read found no settings blob yet — omits `If-Match` so the write
   * is treated as a create. See `putActionWithEtag`.
   */
  updateSystemProperties(
    properties: GlobalSettings,
    token: Token,
    etag: string | undefined,
  ): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_GLOBAL_SETTINGS_URL, properties, token, etag);
  }
}
