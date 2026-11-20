import type { components } from '@epam/ai-dial-typescript-sdk';

import { IF_MATCH } from '@/src/constants/api-headers';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { GlobalSettings } from '@/src/models/system-properties';
import { createIfNoneMatchHeaders } from './asset-headers';
import { CoreApi } from './core-api';

/**
 * Core's global-settings singleton: `v1/settings/{bucket}/{path}` on the `platform` bucket's `global` entry.
 * Addressed on the entity URL rather than through a listing: `ConfigResourceMetadataController` answers 405
 * for this type, because a singleton has no collection to enumerate.
 */
const SETTINGS_BUCKET = 'platform';
const SETTINGS_PATH = 'global';

type SdkEntityMetadata = components['schemas']['EntityMetadata'];

export class SettingsApi extends CoreApi {
  /** Reads the API-written settings blob. A 404 means no override exists, not an error. */
  async globalSettings(token: Token): Promise<ServerActionResponse> {
    return toSettings(
      await this.sdkAction(token, (init) => this.sdk.getGlobalSettings(SETTINGS_BUCKET, SETTINGS_PATH, init)),
    );
  }

  /**
   * Same singleton as {@link globalSettings}, conditional on `etag`. `DEFAULT_ETAG` sends no `If-None-Match`:
   * on a GET, `If-None-Match: *` would ask for a 304 whenever the settings exist.
   */
  async getSystemProperties(token: Token, etag: string): Promise<ServerActionResponse<GlobalSettings>> {
    return toSettings(
      await this.sdkAction(
        token,
        (init) => this.sdk.getGlobalSettings(SETTINGS_BUCKET, SETTINGS_PATH, init),
        createIfNoneMatchHeaders(etag),
      ),
    );
  }

  /**
   * `etag` undefined means the prior read found no settings blob yet — omits `If-Match` so the write
   * is treated as a create. Any other value is sent as-is, `DEFAULT_ETAG` included: `If-Match: *` asserts
   * the settings exist, so this deliberately does not use `createIfMatchHeaders`, which drops `*`.
   */
  updateSystemProperties(
    properties: GlobalSettings,
    token: Token,
    etag: string | undefined,
  ): Promise<ServerActionResponse> {
    return this.sdkAction(
      token,
      (init) =>
        this.sdk.saveGlobalSettings(SETTINGS_BUCKET, SETTINGS_PATH, {
          ...init,
          body: properties,
        }),
      etag ? { [IF_MATCH]: etag } : undefined,
    );
  }
}

/**
 * Drops the `name` / `status` metadata Core adds to the read. A denylist, so a field admin does not model
 * still reaches the page and is written back by the next save.
 */
const toSettings = (result: ServerActionResponse): ServerActionResponse<GlobalSettings> => {
  if (!result.success || result.response == null || typeof result.response !== 'object') {
    return result;
  }

  const { name: __name, status: __status, ...settings } = result.response as GlobalSettings & SdkEntityMetadata;
  return { ...result, response: settings };
};
