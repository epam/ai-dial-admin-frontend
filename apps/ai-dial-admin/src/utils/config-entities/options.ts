import {
  ConfigEntityOption,
  ConfigEntityOptions,
  ConfigFileReadFailure,
  ConfigFileReadResult,
} from '@/src/models/dial/config-file';
import { ConfigEntityOrigin, ConfigFileEntityType } from '@/src/types/config-file-entity';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';

/**
 * The entity types DIAL Core keys by bare short name in its merged `Config` maps, for both the
 * config-file and API-written populations (`MergedConfigStore.isShortNameKeyed` returns true for
 * exactly these). A reference to one of these resolves with a plain `containsKey(ref)` against that
 * one map, so it is the bare name regardless of which population it came from. Routes and keys are
 * not short-name-keyed — an API-written route is still `routes/<bucket>/<name>`, a key
 * `keys/<bucket>/<name>` — so they keep the origin-based canonical form below.
 */
const SHORT_NAME_KEYED_TYPES: ReadonlySet<ConfigFileEntityType> = new Set<ConfigFileEntityType>([
  ConfigFileEntityType.Models,
  ConfigFileEntityType.Interceptors,
  ConfigFileEntityType.Roles,
  ConfigFileEntityType.Applications,
  ConfigFileEntityType.Toolsets,
]);

/**
 * The exact string Core resolves an option to. `ConfigPostProcessor.validateCrossReferences` checks
 * a reference with `interceptors.containsKey(ref)` against `MergedConfigStore`'s single map. For the
 * five short-name-keyed types that map's keys are bare names from both populations, so the reference
 * is the bare name regardless of origin. For routes and keys the two populations are still keyed
 * differently — config-file entries by bare name, API-written entries by `{type}/platform/{name}`
 * (`MergedConfigStore.canonicalId`) — so the origin decides the form there.
 *
 * The single source of truth for the form. The reverse direction is `getInterceptorsGridData`, which
 * matches a stored selection against `row.name` — which is why `toConfigEntityRows` puts the reference
 * there rather than the bare name.
 */
export const getConfigEntityReference = (option: ConfigEntityOption, type: ConfigFileEntityType): string => {
  if (SHORT_NAME_KEYED_TYPES.has(type)) {
    return option.name;
  }
  return option.origin === ConfigEntityOrigin.ConfigFile
    ? option.name
    : `${type}/${PLATFORM_ROOT_FOLDER}/${option.name}`;
};

/**
 * Composes Core's two populations of one entity type into a single option list, in the same pairing
 * `MergedConfigStore` merges and cross-reference validation checks against — so every offered option
 * resolves, and a selection cannot produce a write Core rejects as unresolvable.
 *
 * A name present in both populations yields a single option, keeping the API-written (platform) one:
 * Core's merged map keys the five short-name-keyed types by bare name from both populations, and a
 * blob write supersedes the file entry via ordinary `Map.put`, so the platform entity is the live one
 * and offering the file duplicate would let a user select an entity Core has shadowed. Duplicates
 * *within* one population are collapsed, since there the reference is identical.
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

  // API-written options first so they occupy a name's slot; a config-file entry of the same name is
  // dropped, mirroring Core's blob-supersedes-file `Map.put`. Names unique to one population are kept.
  const apiOptions = toOptions(apiWritten.success ? apiWritten.data : [], ConfigEntityOrigin.Api);
  const seen = new Set(apiOptions.map((option) => option.name));
  const options = [
    ...apiOptions,
    ...toOptions(configFile.success ? configFile.data : [], ConfigEntityOrigin.ConfigFile).filter(
      (option) => !seen.has(option.name) && seen.add(option.name),
    ),
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
