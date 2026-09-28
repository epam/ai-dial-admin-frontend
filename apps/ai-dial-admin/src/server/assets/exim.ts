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

import { FOLDER_NESTED_VERSIONLESS_TYPES } from '@/src/constants/assets-core';
import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { ImportResult } from '@/src/models/import';
import { ParsedAssets } from '@/src/models/import-asset';
import { AssetApi } from '@/src/server/core/asset-api';
import {
  ConsecutiveFailureCircuitBreaker,
  FILES_IMPORT_CIRCUIT_BREAKER_THRESHOLD,
} from '@/src/server/files/circuit-breaker';
import { gatherResourceUrls, isFolderNode, isTechnicalItem } from '@/src/server/folders/resource-walk';
import {
  decodeCorePath,
  parseEncodedFolderPath,
  parseEncodedVersionedPath,
  stripPrefix,
} from '@/src/server/publications/path';
import { ConflictResolutionPolicy, ImportStatus } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { resolveImportDestination } from './import-destination';

export interface AssetEximConfig<T extends { id?: string; _metadata?: unknown }> {
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

const isFolderPath = async (assetApi: AssetApi, token: Token, resourceType: ResourceType, path: string) => {
  const node = await assetApi.getMetadata(token, resourceType, path, { recursive: false });
  return Boolean(node && isFolderNode(node));
};

/** Expands a folder path into every descendant resource's bare path, at any nesting depth. */
const expandFolderPath = async (
  assetApi: AssetApi,
  token: Token,
  resourceType: ResourceType,
  path: string,
): Promise<string[]> => {
  const prefix = RESOURCE_TYPE_PREFIX[resourceType];
  const urls = await gatherResourceUrls(
    (folderPath, nextToken) => assetApi.getMetadata(token, resourceType, folderPath, { recursive: true, nextToken }),
    path,
  );
  return urls.map((url) => decodeCorePath(stripPrefix(url, prefix))).filter((leafPath) => !isTechnicalItem(leafPath));
};

/** Resolves an incoming path to the leaf resource paths it stands for — itself, or every descendant if it's a folder. */
const resolveExportPaths = async (
  assetApi: AssetApi,
  token: Token,
  resourceType: ResourceType,
  path: string,
): Promise<string[]> =>
  (await isFolderPath(assetApi, token, resourceType, path))
    ? expandFolderPath(assetApi, token, resourceType, path)
    : [path];

/** Builds the `{ <field>: T[] }` export document directly from DIAL Core. */
export const buildAssetsExport = async <T extends { id?: string; _metadata?: unknown }>(
  config: AssetEximConfig<T>,
  assetApi: AssetApi,
  token: Token,
  paths: string[],
): Promise<ParsedAssets> => {
  const entities: T[] = [];
  for (const path of paths) {
    const leafPaths = await resolveExportPaths(assetApi, token, config.resourceType, path);
    for (const leafPath of leafPaths) {
      const entity = await assetApi.getMerged<T>(token, config.resourceType, leafPath);
      if (entity) {
        entities.push({ ...entity, id: `${RESOURCE_TYPE_PREFIX[config.resourceType]}${leafPath}` });
      }
    }
  }
  return config.setEntities(entities);
};

/**
 * Strips flat admin-format identity fields (`folderId`/`path`/`version`/`id`) off an entity before
 * any write to Core. The merge layer no longer grafts these flat — they nest under `_metadata`,
 * which `stripMetadata` drops — but `buildAssetsExport` stamps `id` on every entry, and an older
 * or hand-edited export document may still carry the flat spellings. Core's content DTOs have no
 * such fields and reject them outright (`FAIL_ON_UNKNOWN_PROPERTIES`, the Jackson default). Use as
 * a type's `transformForPut` (or compose into one) whenever the entity carries no other
 * admin-only fields needing to be stripped before `put`.
 */
export const stripAssetIdentityFields = <T extends { folderId?: string; path?: string; version?: string; id?: string }>(
  entity: T,
): T => {
  const { folderId: __folderId, path: __path, version: __version, id: __id, ...rest } = entity;
  return rest as T;
};

/**
 * Strips the merge layer's `_metadata` graft object off an entity before any write to Core — the
 * wholesale replacement for the per-field `status`/`validationWarnings`/`path`/`folderId`/
 * `author`/`createdAt`/`updatedAt` destructuring every write path used to repeat (see the
 * `core-resource-entity-metadata` capability). Per-type write quirks that are not merge grafts
 * (prompt `id`, key `name`/`key`, toolset `reference`/`displayVersion`) stay in their own payload
 * builders, composed around this strip. Core's strict `FAIL_ON_UNKNOWN_PROPERTIES` deserialization
 * makes a forgotten strip a loud 400, not a silent data loss.
 */
export const stripMetadata = <T extends { _metadata?: unknown }>(entity: T): Omit<T, '_metadata'> => {
  const { _metadata: __metadata, ...rest } = entity;
  return rest;
};

/**
 * Strips a platform-bucket asset's identity/provenance fields before it's spread into a flat-bucket
 * create/update payload: `_metadata` (via `stripMetadata`) plus `reference`/`createdAt`/`updatedAt`,
 * none of which round-trip on a platform-bucket write (Core's `ConfigResourceController` rejects
 * unknown properties). Shared by `assets-applications/actions.ts`'s and `assets-toolsets/actions.ts`'s
 * platform create/update actions, which used to carry identical, independently-written strippers.
 */
export const stripPlatformAssetFields = <
  T extends { _metadata?: unknown; reference?: string; createdAt?: string; updatedAt?: string },
>(
  entity: T,
): Omit<T, '_metadata' | 'reference' | 'createdAt' | 'updatedAt'> => {
  const { reference: __reference, createdAt: __createdAt, updatedAt: __updatedAt, ...payload } = stripMetadata(entity);
  return payload as Omit<T, '_metadata' | 'reference' | 'createdAt' | 'updatedAt'>;
};

export interface ImportAssetsOptions {
  path: string;
  conflictResolutionStrategy: string;
  flatImport?: boolean;
}

/** Imports a `{ <field>: T[] }` document directly against DIAL Core. */
export const importAssetsExport = async <T extends { id?: string; _metadata?: unknown }>(
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

    // Folder-nested versionless types (prompt/conversation) never split a `__` suffix off the
    // name; versioned types (application/toolset) keep the `__version` split.
    const {
      folderId: originalFolderId,
      name,
      version,
    } = FOLDER_NESTED_VERSIONLESS_TYPES.has(config.resourceType)
      ? { ...parseEncodedFolderPath(sourcePath, prefix), version: undefined }
      : parseEncodedVersionedPath(sourcePath, prefix);
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

    // Export documents carry `_metadata` as provenance, but no written body may: the config
    // resource DTOs 400 on it, and the resource DTOs would store it verbatim. Stripped here so
    // every type's import is covered, with or without its own `transformForPut`.
    const transformed = config.transformForPut ? config.transformForPut(entity) : entity;
    const body = stripMetadata(transformed);
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
