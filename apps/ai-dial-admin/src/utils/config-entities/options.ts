import {
  ConfigEntityOption,
  ConfigEntityOptions,
  ConfigFileReadFailure,
  ConfigFileReadResult,
} from '@/src/models/dial/config-file';
import { ConfigEntityOrigin, ConfigFileEntityType } from '@/src/types/config-file-entity';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';

/**
 * The exact string Core resolves an option to. `ConfigPostProcessor.validateCrossReferences` checks
 * a reference with `interceptors.containsKey(ref)` against `MergedConfigStore`'s single map, whose
 * keys are bare names for config-file entries and `{type}/{bucket}/{name}` for API-written ones
 * (`MergedConfigStore.canonicalId`). The two forms are different keys, not aliases.
 *
 * The single source of truth for the form. The reverse direction is `getInterceptorsGridData`, which
 * matches a stored selection against `row.name` — which is why `toConfigEntityRows` puts the reference
 * there rather than the bare name.
 */
export const getConfigEntityReference = (option: ConfigEntityOption, type: ConfigFileEntityType): string =>
  option.origin === ConfigEntityOrigin.ConfigFile ? option.name : `${type}/${PLATFORM_ROOT_FOLDER}/${option.name}`;

/**
 * Composes Core's two populations of one entity type into a single option list, in the same pairing
 * `MergedConfigStore` merges and cross-reference validation checks against — so every offered option
 * resolves, and a selection cannot produce a write Core rejects as unresolvable.
 *
 * A name present in both populations yields two options: the forms are not interchangeable, so
 * collapsing them would make the stored reference ambiguous. Duplicates *within* one population are
 * collapsed, since there the reference is identical.
 *
 * Partial failure degrades rather than empties: whichever population was read is still offered and
 * the failure is reported alongside it. Only a total failure returns a failure.
 */
export const unionConfigEntityOptions = (
  apiWritten: ConfigFileReadResult<string[]>,
  configFile: ConfigFileReadResult<string[]>,
): ConfigFileReadResult<ConfigEntityOptions> => {
  if (!apiWritten.success && !configFile.success) {
    // Both reasons are kept: a config-file 403 would otherwise be invisible whenever the metadata read
    // also failed, leaving no trace of a permissions problem worth acting on.
    return {
      success: false,
      failure: {
        ...apiWritten.failure,
        errorMessage: [apiWritten.failure.errorMessage, configFile.failure.errorMessage].filter(Boolean).join('; '),
      },
    };
  }

  const failures: ConfigFileReadFailure[] = [];
  if (!apiWritten.success) {
    failures.push(apiWritten.failure);
  }
  if (!configFile.success) {
    failures.push(configFile.failure);
  }

  const options = [
    ...toOptions(configFile.success ? configFile.data : [], ConfigEntityOrigin.ConfigFile),
    ...toOptions(apiWritten.success ? apiWritten.data : [], ConfigEntityOrigin.Api),
  ];

  return { success: true, data: { options, failures } };
};

const toOptions = (names: string[], origin: ConfigEntityOrigin): ConfigEntityOption[] => {
  const seen = new Set<string>();
  return names.reduce<ConfigEntityOption[]>((acc, name) => {
    if (name && !seen.has(name)) {
      seen.add(name);
      acc.push({ name, origin });
    }
    return acc;
  }, []);
};
