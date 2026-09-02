import { DialApplicationScheme } from '@/src/models/dial/application';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { toRunnerReference } from '@/src/utils/app-runners/runner-reference';
import { AppRunnerOption, AppRunnerOrigin } from './models';

export const getRunnerOrigin = (runner: DialApplicationScheme): AppRunnerOrigin =>
  (runner as AppRunnerOption).origin || AppRunnerOrigin.Entity;

const toEntityOption = (runner: DialApplicationScheme): AppRunnerOption => ({
  ...runner,
  origin: AppRunnerOrigin.Entity,
  reference: runner.$id || '',
});

// Timestamps come from the Core metadata node, so they are available without a content read —
// unlike display name, description and topics, which live in the body and stay empty here.
const toAssetOption = (runner: ResourceInfo): AppRunnerOption => ({
  $id: runner.name,
  origin: AppRunnerOrigin.Asset,
  reference: toRunnerReference(runner.name),
  path: runner.path,
  author: runner.author,
  createdAt: runner.createdAt,
  updatedAt: runner.updatedAt,
});

export const buildAppRunnerOptions = (
  entityRunners?: DialApplicationScheme[] | null,
  assetRunners?: ResourceInfo[] | null,
): AppRunnerOption[] => [...(entityRunners || []).map(toEntityOption), ...(assetRunners || []).map(toAssetOption)];
