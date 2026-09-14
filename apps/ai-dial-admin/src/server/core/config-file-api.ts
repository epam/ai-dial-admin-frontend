import { CORE_CONFIG_FILE_URL, READABLE_CONFIG_FILE_TYPES } from '@/src/constants/config-file-core';
import { Token } from '@/src/models/auth';
import { ConfigFileListResponse, ConfigFileReadFailure, ConfigFileReadResult } from '@/src/models/dial/config-file';
import { ServerActionResponse } from '@/src/models/server-action';
import { ConfigFileEntityType, ConfigFileFailureReason } from '@/src/types/config-file-entity';
import { CoreApi } from './core-api';

/**
 * Reads DIAL Core's config-file entities — the half of its merged configuration that comes from
 * `aidial.config.json` rather than from writes through its API. Core's `MergedConfigStore` is the
 * union of the two, and cross-reference validation checks against that union, so a picker offering
 * only API-written entries cannot express every configuration Core accepts.
 *
 * Deliberately not part of `AssetApi`: this route family is read-only and not bucket-scoped, so
 * modelling it as a `ResourceType` would hand `AssetApi` a type it must refuse to write.
 */
export class ConfigFileApi extends CoreApi {
  /**
   * Lists the names declared in configuration for one type. Core emits the whole population in a
   * single response — `handleList` iterates the key set with no token or limit — so there is no
   * pagination to follow here, unlike the metadata route.
   */
  async listNames(token: Token, type: ConfigFileEntityType): Promise<ConfigFileReadResult<string[]>> {
    const refusal = unreadableTypeFailure(type);
    if (refusal) {
      return { success: false, failure: refusal };
    }

    const res = await this.getAction(`${CORE_CONFIG_FILE_URL}/${type}`, token);
    if (!res.success) {
      return toRequestFailure(res);
    }

    // A body that is not the documented `{items:[{name}]}` envelope is a contract violation, not an
    // empty population — reporting it as success would hide half the options behind a silent pass.
    const items = (res.response as ConfigFileListResponse | null)?.items;
    if (!Array.isArray(items)) {
      return {
        success: false,
        failure: {
          reason: ConfigFileFailureReason.RequestFailed,
          status: res.status,
          errorMessage: `Unexpected config-file listing body for "${type}" — expected an "items" array`,
        },
      };
    }
    return { success: true, data: items.map((item) => item?.name).filter(Boolean) };
  }

  /**
   * Reads one entity in full. Core injects `name` and `status` into the response and drops every
   * `@EncryptedField`, so this never returns a secret.
   */
  async getEntity<T>(token: Token, type: ConfigFileEntityType, name: string): Promise<ConfigFileReadResult<T>> {
    const refusal = unreadableTypeFailure(type);
    if (refusal) {
      return { success: false, failure: refusal };
    }

    const res = await this.getAction(`${CORE_CONFIG_FILE_URL}/${type}/${encodeURIComponent(name)}`, token);
    if (!res.success) {
      return toRequestFailure(res);
    }

    return { success: true, data: res.response as T };
  }
}

const unreadableTypeFailure = (type: ConfigFileEntityType): ConfigFileReadFailure | null => {
  if (READABLE_CONFIG_FILE_TYPES.has(type)) {
    return null;
  }
  return {
    reason: ConfigFileFailureReason.TypeNotReadable,
    errorMessage: `Config-file type "${type}" is not readable`,
  };
};

const toRequestFailure = <T>(res: ServerActionResponse): ConfigFileReadResult<T> => ({
  success: false,
  failure: {
    reason: ConfigFileFailureReason.RequestFailed,
    status: res.status,
    errorHeader: res.errorHeader,
    errorMessage: res.errorMessage,
    requestId: res.requestId,
  },
});
