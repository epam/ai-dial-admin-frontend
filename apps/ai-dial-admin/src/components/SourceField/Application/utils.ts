import { DialApplicationScheme } from '@/src/models/dial/application';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import { toRunnerReference } from '@/src/utils/app-runners/runner-reference';
import { appendUrlQuery, getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { AppRunnerOption, AppRunnerOrigin } from './models';

export const getRunnerOrigin = (runner: DialApplicationScheme): AppRunnerOrigin =>
  (runner as AppRunnerOption).origin || AppRunnerOrigin.Config;

const toConfigOption = (runner: DialApplicationScheme): AppRunnerOption => ({
  ...runner,
  origin: AppRunnerOrigin.Config,
  reference: runner.$id || '',
  $id: runner.$id || runner.name,
});

// Timestamps come from the Core metadata node, so they are available without a content read —
// unlike display name, description and topics, which live in the body and stay empty here.
// `$id` here is only the name decoded at list-read time — it reflects the runner's `$id` as of
// creation, not any later content edit. Resolving against a Platform runner's *current* `$id`
// requires a content read; see `resolveAppRunnerScheme`.
const toPlatformOption = (runner: ResourceInfo): AppRunnerOption => ({
  $id: (runner as DialApplicationScheme).$id || runner.name,
  origin: AppRunnerOrigin.Platform,
  reference: toRunnerReference(runner.name),
  path: runner.path,
  author: runner.author,
  createdAt: runner.createdAt,
  updatedAt: runner.updatedAt,
});

export const buildAppRunnerOptions = (
  entityRunners?: DialApplicationScheme[] | null,
  assetRunners?: ResourceInfo[] | null,
): AppRunnerOption[] => [...(entityRunners || []).map(toConfigOption), ...(assetRunners || []).map(toPlatformOption)];

/**
 * Where the merged picker's Open control leads — the `Assets > App Runners` detail page, addressed the
 * way that list's `handleOpenInNewTab` does: a Platform runner by storage path, a configuration-file
 * runner by `$id` in `configFile=true` mode. `undefined` for an option that carries neither.
 */
export const getRunnerOpenUrl = (runner: DialApplicationScheme, locale: string): string | undefined => {
  const option = runner as AppRunnerOption;

  if (getRunnerOrigin(runner) === AppRunnerOrigin.Platform) {
    return option.path
      ? `/${locale}${getUrnForEntity(ApplicationRoute.PlatformAppRunners, { path: option.path })}`
      : undefined;
  }

  return option.reference && runner.$id
    ? `/${locale}${appendUrlQuery(getUrnForEntity(ApplicationRoute.PlatformAppRunners, { name: runner.$id }), 'configFile=true')}`
    : undefined;
};
