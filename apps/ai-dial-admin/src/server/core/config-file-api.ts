import { CORE_CONFIG_FILE_URL, READABLE_CONFIG_FILE_TYPES } from '@/src/constants/config-file-core';
import { Token } from '@/src/models/auth';
import {
  ConfigFileListResponse,
  ConfigFileListResult,
  ConfigFileReadFailure,
  ConfigFileReadResult,
} from '@/src/models/dial/config-file';
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

  /**
   * Reads the full population of one type — every entity in full, not just its name. Core's list
   * route (`listNames`) never returns more than a name per entry — verified against
   * `FileConfigController.handleList`, which builds each item as `{name: key}` and nothing else, with
   * no parameter to ask for full bodies — so this composes it with a per-name `getEntity`: there is no
   * bulk-read-with-bodies route to call instead. The N+1 request cost this implies is real but
   * deliberately accepted: `useConfigFileEntityList` only calls `list` once a user opts into
   * `showConfigFiles` for that entity type, so it is never paid by a deployment that doesn't use this
   * surface. Mirrors `getConfigEntityOptions`'s partial-success shape: a name whose `getEntity` fails
   * is reported in `failures` rather than silently dropped, while every entity that did read
   * successfully is still returned. The outer `ConfigFileReadResult` only fails when the type is
   * unreadable or the name listing itself fails — at that point there is no population to return even
   * partially.
   */
  async list<T>(token: Token, type: ConfigFileEntityType): Promise<ConfigFileReadResult<ConfigFileListResult<T>>> {
    const refusal = unreadableTypeFailure(type);
    if (refusal) {
      return { success: false, failure: refusal };
    }

    const names = await this.listNames(token, type);
    if (!names.success) {
      return names;
    }

    const reads = await Promise.all(names.data.map((name) => this.getEntity<T>(token, type, name)));
    const entities: T[] = [];
    const failures: ConfigFileReadFailure[] = [];
    reads.forEach((read) => {
      if (read.success) {
        entities.push(read.data);
      } else {
        failures.push(read.failure);
      }
    });

    return { success: true, data: { entities, failures } };
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
