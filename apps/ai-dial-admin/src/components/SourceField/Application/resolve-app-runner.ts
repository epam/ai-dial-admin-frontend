import { getResolvedApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import { getResolvedRunnerSchema, getRunner } from '@/src/app/[lang]/platform-app-runners/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { AppRunnerOption, AppRunnerOrigin } from './models';
import { getRunnerOrigin } from './utils';

export interface ResolvedAppRunner {
  runner?: DialApplicationScheme;
  scheme?: DialApplicationScheme;
}

/**
 * Resolves a picked/current runner's scheme by origin, shared by `AppRunners.tsx` (picker selection)
 * and `ParametersTab.tsx` (Parameters view).
 *
 * A `Platform` runner's option `$id` is decoded from its Core resource name (see `toAssetOption`) and
 * only reflects the runner's `$id` as of creation — a later edit to the runner's content changes its
 * `$id` without renaming the resource. Resolving against that stale id both fetches the wrong scheme
 * and, if the caller persists it, keeps failing to resolve on every future load. So a `Platform` runner
 * is read fresh via `getRunner` first, and its *content* `$id` — carried on the returned `runner` — is
 * what `getResolvedRunnerSchema` is called with; a failed content read falls back to the original
 * option, matching this function's own failure-fallback behavior.
 */
export const resolveAppRunnerScheme = async (runner?: DialApplicationScheme): Promise<ResolvedAppRunner> => {
  if (!runner) {
    return {};
  }

  if (getRunnerOrigin(runner) === AppRunnerOrigin.Platform) {
    const path = (runner as AppRunnerOption).path;
    const detailRes = path ? await getRunner(path, DEFAULT_ETAG) : undefined;
    const resolvedRunner = detailRes?.success ? (detailRes.response as DialApplicationScheme) : runner;

    const schemeRes = await getResolvedRunnerSchema(resolvedRunner.$id ?? '');
    return {
      runner: resolvedRunner,
      scheme: schemeRes.success ? (schemeRes.response as DialApplicationScheme) : resolvedRunner,
    };
  }

  const schemeRes = await getResolvedApplicationScheme(runner.$id ?? '');
  return {
    runner,
    scheme: schemeRes.success ? (schemeRes.response as { schema?: DialApplicationScheme })?.schema : runner,
  };
};
