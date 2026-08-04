import { assetApi, configFileApi, settingsApi } from '@/src/app/api/api';
import { GLOBAL_SETTINGS_NAME, METADATA_RESOURCE_TYPE } from '@/src/constants/config-file-core';
import { Token } from '@/src/models/auth';
import { ConfigEntityOptions, ConfigFileReadResult } from '@/src/models/dial/config-file';
import { GlobalSettings } from '@/src/models/system-properties';
import { ConfigFileEntityType, ConfigFileFailureReason } from '@/src/types/config-file-entity';
import { unionConfigEntityOptions } from '@/src/utils/config-entities/options';

const HTTP_NOT_FOUND = 404;

/**
 * Reads both of Core's populations for one entity type and unions them into a picker's option list.
 *
 * The two reads are issued concurrently and neither can veto the other — a single failure degrades to
 * the surviving population plus a reported failure, which is why the metadata half is read through
 * `getMetadata` rather than `assetApi.list`: `list` returns `[]` for a failed read, making a refusal
 * indistinguishable from an empty population.
 */
export const getConfigEntityOptions = async (
  token: Token,
  type: ConfigFileEntityType,
): Promise<ConfigFileReadResult<ConfigEntityOptions>> => {
  const [apiWritten, configFile] = await Promise.all([
    toFailureOnThrow(listApiWrittenNames(token, type)),
    toFailureOnThrow(configFileApi.listNames(token, type)),
  ]);

  return unionConfigEntityOptions(apiWritten, configFile);
};

/**
 * Converts a rejected read into a reported failure.
 *
 * Without this a throw escapes to the caller's own error handling, which loses the per-population
 * distinction the union depends on: one unexpected body shape would empty *both* pickers with nothing
 * reported — the exact silent option loss this design set out to prevent.
 */
const toFailureOnThrow = (read: Promise<ConfigFileReadResult<string[]>>): Promise<ConfigFileReadResult<string[]>> =>
  read.catch((error) => ({
    success: false as const,
    failure: {
      reason: ConfigFileFailureReason.RequestFailed,
      errorMessage: error instanceof Error ? error.message : String(error),
    },
  }));

/**
 * Global interceptors as Core resolves them.
 *
 * Deliberately not a union, unlike the per-entity lists: `MergedConfigStore.applySettingsOverlay` has
 * the API-written settings blob *replace* the file value when the blob exists, so the populations
 * override rather than combine. A missing blob is the normal case, not a failure — the settings
 * singleton simply has no API override until someone writes one.
 */
export const getGlobalInterceptors = async (token: Token): Promise<ConfigFileReadResult<string[]>> => {
  const blob = await settingsApi.globalSettings(token);
  if (blob.success) {
    return { success: true, data: (blob.response as GlobalSettings | null)?.globalInterceptors ?? [] };
  }
  if (blob.status !== HTTP_NOT_FOUND) {
    return {
      success: false,
      failure: {
        reason: ConfigFileFailureReason.RequestFailed,
        status: blob.status,
        errorHeader: blob.errorHeader,
        errorMessage: blob.errorMessage,
      },
    };
  }

  const file = await configFileApi.getEntity<GlobalSettings>(
    token,
    ConfigFileEntityType.Settings,
    GLOBAL_SETTINGS_NAME,
  );
  if (!file.success) {
    // `FileConfigController` answers 200 for the settings singleton even with nothing configured, so a
    // 404 here is not the expected "none configured" path — it is kept only so a future route change
    // degrades to an empty chain rather than a hard failure. Anything else is reported.
    return file.failure.status === HTTP_NOT_FOUND ? { success: true, data: [] } : file;
  }

  return { success: true, data: file.data?.globalInterceptors ?? [] };
};

/** Core is trusted for the contract, not for the runtime body: a non-array `items` must not throw. */
const toNameList = (items: unknown): { name: string }[] => (Array.isArray(items) ? items : []);

const listApiWrittenNames = async (
  token: Token,
  type: ConfigFileEntityType,
): Promise<ConfigFileReadResult<string[]>> => {
  const resourceType = METADATA_RESOURCE_TYPE[type];
  if (!resourceType) {
    return {
      success: false,
      failure: {
        reason: ConfigFileFailureReason.TypeNotReadable,
        errorMessage: `Config type "${type}" has no metadata listing`,
      },
    };
  }

  const names: string[] = [];
  let nextToken: string | undefined;

  do {
    const node = await assetApi.getMetadata(token, resourceType, '', { recursive: false, nextToken });
    if (!node) {
      // `getMetadata` collapses 403/404/500 to null, so a status is genuinely unavailable here — name
      // the read that failed rather than emitting a reason with no context.
      return {
        success: false,
        failure: {
          reason: ConfigFileFailureReason.RequestFailed,
          errorMessage: `Metadata listing for "${type}" could not be read from DIAL Core`,
        },
      };
    }
    names.push(
      ...toNameList(node.items)
        .map((item) => item.name)
        .filter(Boolean),
    );
    nextToken = node.nextToken;
  } while (nextToken);

  return { success: true, data: names };
};
