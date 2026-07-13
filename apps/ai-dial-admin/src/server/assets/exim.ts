/**
 * Generic aggregate-document JSON import/export, shared by every versioned asset type that
 * needs it (prompts/toolsets/applications) — the same pattern ported from the admin backend's
 * `PromptEximService`/`ToolSetEximService`/`ApplicationEximService`: a structured document
 * (`{ <field>: T[] }`), OVERRIDE/SKIP conflict resolution against Core's live state, and the
 * consecutive-failure circuit breaker already built for Files. Per-type differences (which
 * `ParsedAssets` field, whether ids need a stricter shape than "starts with the type prefix",
 * whether the entity needs a transform before `put`) are captured in an `AssetEximConfig`
 * supplied by each resource type's thin wrapper module.
 */

import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { ImportResult } from '@/src/models/import';
import { ParsedAssets } from '@/src/models/import-asset';
import { AssetApi } from '@/src/server/core/asset-api';
import {
  ConsecutiveFailureCircuitBreaker,
  FILES_IMPORT_CIRCUIT_BREAKER_THRESHOLD,
} from '@/src/server/files/circuit-breaker';
import { parseEncodedVersionedPath } from '@/src/server/publications/path';
import { ConflictResolutionPolicy, ImportStatus } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { resolveImportDestination } from './import-destination';

export interface AssetEximConfig<T extends { id?: string }> {
  resourceType: ResourceType;
  /** Reads this asset type's entities out of a `ParsedAssets` document. */
  getEntities: (document: ParsedAssets) => T[] | undefined;
  /** Wraps entities back into a `ParsedAssets` document, under this asset type's field. */
  setEntities: (entities: T[]) => ParsedAssets;
  /** Defaults to "starts with the type's Core prefix" when omitted (toolsets/applications). */
  isValidId?: (id: string) => boolean;
  /** Applied to each entity immediately before `put`, e.g. prompts default `content`. */
  transformForPut?: (entity: T) => T;
}

/** Builds the `{ <field>: T[] }` export document directly from DIAL Core. */
export const buildAssetsExport = async <T extends { id?: string }>(
  config: AssetEximConfig<T>,
  assetApi: AssetApi,
  token: Token,
  paths: string[],
): Promise<ParsedAssets> => {
  const entities: T[] = [];
  for (const path of paths) {
    const entity = await assetApi.getMerged<T>(token, config.resourceType, path);
    if (entity) {
      entities.push({ ...entity, id: `${RESOURCE_TYPE_PREFIX[config.resourceType]}${path}` });
    }
  }
  return config.setEntities(entities);
};

export interface ImportAssetsOptions {
  path: string;
  conflictResolutionStrategy: string;
  flatImport?: boolean;
}

/** Imports a `{ <field>: T[] }` document directly against DIAL Core. */
export const importAssetsExport = async <T extends { id?: string }>(
  config: AssetEximConfig<T>,
  assetApi: AssetApi,
  token: Token,
  document: ParsedAssets,
  options: ImportAssetsOptions,
): Promise<{ importResults: ImportResult[] }> => {
  const entities = config.getEntities(document) || [];
  const prefix = RESOURCE_TYPE_PREFIX[config.resourceType];
  const isValidId = config.isValidId || ((id: string) => id.startsWith(prefix));
  const circuitBreaker = new ConsecutiveFailureCircuitBreaker(FILES_IMPORT_CIRCUIT_BREAKER_THRESHOLD);
  const existingPathsByFolder = new Map<string, Set<string>>();
  const importResults: ImportResult[] = [];

  for (const entity of entities) {
    if (circuitBreaker.isOpen()) {
      break;
    }

    const sourcePath = entity.id || '';
    if (!isValidId(sourcePath)) {
      importResults.push({ sourcePath, targetPath: '', status: ImportStatus.FAILED });
      circuitBreaker.recordFailure();
      continue;
    }

    const { folderId: originalFolderId, name, version } = parseEncodedVersionedPath(sourcePath, prefix);
    const targetPath = resolveImportDestination(options.path, originalFolderId, name, version, options.flatImport);
    const lastSlashIndex = targetPath.lastIndexOf('/');
    const targetFolderId = lastSlashIndex === -1 ? '' : targetPath.slice(0, lastSlashIndex + 1);

    let existingPaths = existingPathsByFolder.get(targetFolderId);
    if (!existingPaths) {
      const items = await assetApi.list(token, config.resourceType, targetFolderId);
      existingPaths = new Set(items.map((item) => item.path));
      existingPathsByFolder.set(targetFolderId, existingPaths);
    }

    const conflict = existingPaths.has(targetPath);
    if (conflict && options.conflictResolutionStrategy === ConflictResolutionPolicy.SKIP) {
      importResults.push({ sourcePath, targetPath, status: ImportStatus.SKIP });
      continue;
    }

    const body = config.transformForPut ? config.transformForPut(entity) : entity;
    const result = await assetApi.put(token, config.resourceType, targetPath, body, { allowOverride: true });

    if (result.success) {
      importResults.push({ sourcePath, targetPath, status: ImportStatus.SUCCESS });
      existingPaths.add(targetPath);
      circuitBreaker.recordSuccess();
    } else {
      importResults.push({ sourcePath, targetPath, status: ImportStatus.FAILED });
      circuitBreaker.recordFailure();
    }
  }

  return { importResults };
};
