import { DialApplicationScheme } from '@/src/models/dial/application';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { toRunnerReference } from '@/src/utils/app-runners/runner-reference';
import { AppRunnerOption, AppRunnerOrigin } from './models';

export const getRunnerOrigin = (runner: DialApplicationScheme): AppRunnerOrigin =>
  (runner as AppRunnerOption).origin || AppRunnerOrigin.Config;

const toConfigOption = (runner: DialApplicationScheme): AppRunnerOption => ({
  ...runner,
  origin: AppRunnerOrigin.Config,
  reference: runner.$id || '',
});

// Timestamps come from the Core metadata node, so they are available without a content read —
// unlike display name, description and topics, which live in the body and stay empty here.
// `$id` here is only the name decoded at list-read time — it reflects the runner's `$id` as of
// creation, not any later content edit. Resolving against a Platform runner's *current* `$id`
// requires a content read; see `resolveAppRunnerScheme`.
const toPlatformOption = (runner: ResourceInfo): AppRunnerOption => ({
  $id: runner.name,
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
