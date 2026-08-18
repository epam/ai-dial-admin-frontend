import { assetApi, filesCoreApi, publicationsApi, skillsCoreApi } from '@/src/app/api/api';
import { PUBLICATIONS_PREFIX, RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialRule } from '@/src/models/dial/rule';
import { ServerActionResponse } from '@/src/models/server-action';
import { toSkillList } from '@/src/server/core/skill-metadata';
import { decodeCorePath, encodeCorePath, stripPrefix } from '@/src/server/publications/path';
import { CoreResourceAction, CorePublicationResource, CorePublicationRule } from '@/src/server/publications/models';
import { ResourceType } from '@/src/types/resource-type';
import { removeTrailingSlash, replacePathPrefix } from '@/src/utils/files/path';
import { addTrailingSlash } from '@/src/utils/url';
import { FolderNode, mergeFolderTrees, toFolderTree } from './folder-tree';
import { fetchAllPages, gatherResourceUrls, WalkableNode } from './resource-walk';

/**
 * Cross-type folder orchestration, ported from the backend's `FolderService` — which makes
 * zero direct Core calls itself and instead fans out to the five per-type resource services
 * (now the five per-type Core clients built by the prior migrations) or to `PublicationService`.
 * See `migrate-folders-to-core`'s design.md for the full BE-to-Core operation map.
 */

const ALL_TYPES: ResourceType[] = [
  ResourceType.APPLICATION,
  ResourceType.TOOLSET,
  ResourceType.CONVERSATION,
  ResourceType.PROMPT,
  ResourceType.FILE,
];

const DEFAULT_ETAG = '*';

/**
 * Reads one page of a resource type's recursive metadata for `path`. Used only where a true
 * deep walk is needed — gathering every descendant resource for folder unpublish/move (the
 * backend's own `ResourceService.getResourceUrls` default method explicitly sets
 * `recursive(true)`, unlike `getFolders` below). Callers that need the full (paginated,
 * flattened) result should wrap this with `fetchAllPages`.
 */
const readRecursiveMetadata =
  (token: Token, type: ResourceType) =>
  (path: string, nextToken?: string): Promise<WalkableNode | null> => {
    if (type === ResourceType.FILE) {
      return filesCoreApi.getFileMetadata(token, path, true, nextToken);
    }
    return assetApi.getMetadata(token, type, path, { recursive: true, nextToken });
  };

/**
 * Reads one page of a resource type's **non-recursive** metadata for `path` — one level
 * only. Ported from the backend's actual `getFolders` (`PromptService.getFolders` and its
 * per-type siblings): each calls `getMetadata(request)` using whatever `recursive` flag is on
 * the *caller's* request, and the admin FE's own `FolderController`/`FolderService.getFolders`
 * request never sets it, so it defaults to `false` — confirmed by both the request DTO
 * (`ResourceMetadataRequestDto.recursive` is a primitive `boolean`, defaulting `false` when
 * absent from the JSON body) and by the admin FE's own OLD `foldersApi.getFolders(token,
 * path)`, which posted `{ path }` with no `recursive` field, and by its lazy per-segment
 * folder walk (`RuleFolderContext.tsx`'s `fetchFiles`/`processNext`, which calls `getFolders`
 * again for each path segment as the user navigates, rather than expecting one deep response).
 * `getFoldersCore` must reproduce this exact call, not the recursive one above, to match the
 * old BE-backed `foldersApi.getFolders`'s result.
 */
const readFolderMetadata =
  (token: Token, type: ResourceType) =>
  (path: string, nextToken?: string): Promise<WalkableNode | null> => {
    if (type === ResourceType.FILE) {
      return filesCoreApi.getFileMetadata(token, path, false, nextToken);
    }
    return assetApi.getMetadata(token, type, path, { recursive: false, nextToken });
  };

const folderExists = async (token: Token, type: ResourceType, path: string): Promise<boolean> => {
  try {
    const node =
      type === ResourceType.FILE
        ? await filesCoreApi.getFileMetadata(token, path, false)
        : await assetApi.getMetadata(token, type, path, { recursive: false });
    return Boolean(node);
  } catch {
    return false;
  }
};

const stripPublicationsPrefix = (url: string): string => stripPrefix(url, PUBLICATIONS_PREFIX);

/**
 * Creates a publication and immediately approves it, returning the approve result (design D1/D2:
 * folder rules-update and unpublish both drive this two-step flow with no separate approval
 * step exposed to the caller).
 */
const createAndApprovePublication = async (
  token: Token,
  targetFolder: string,
  resources: CorePublicationResource[],
  rules?: CorePublicationRule[],
): Promise<ServerActionResponse> => {
  const createResult = await publicationsApi.createPublication(token, encodeCorePath(targetFolder), resources, rules);
  if (!createResult.success) {
    return createResult;
  }
  const createdUrl = (createResult.response as { url?: string } | undefined)?.url;
  if (!createdUrl) {
    return { success: false, errorHeader: 'Error', errorMessage: 'Publication creation did not return a url' };
  }
  return publicationsApi.approvePublication(token, stripPublicationsPrefix(createdUrl));
};

/**
 * Folder listing: merges all five resource types' **one-level** folder trees, validating
 * consistency (design D4). Non-recursive, matching the backend's real `getFolders` behavior
 * and the admin FE's own old `foldersApi.getFolders` result (see `readFolderMetadata`) —
 * callers walk deeper by calling this again with a child path, the same lazy pattern
 * `RuleFolderContext` already uses.
 */
export async function getFoldersCore(token: Token, path: string): Promise<FolderNode | null> {
  const trees = await Promise.all(
    ALL_TYPES.map(async (type) => {
      const node = await fetchAllPages((nextToken) => readFolderMetadata(token, type)(path, nextToken)).catch(
        () => null,
      );
      return node ? toFolderTree(node, RESOURCE_TYPE_PREFIX[type]) : null;
    }),
  );
  return mergeFolderTrees(trees);
}

/** Reads a folder's rules via the Core publications rule-list op (design D2). */
export async function getRulesCore(
  token: Token,
  path: string,
): Promise<ServerActionResponse<Record<string, DialRule[]>>> {
  const result = await publicationsApi.ruleList(token, path);
  if (!result.success) {
    return result as ServerActionResponse<Record<string, DialRule[]>>;
  }
  const rules = (result.response?.rules as Record<string, DialRule[]>) || {};
  const decodedRules = Object.fromEntries(Object.entries(rules).map(([key, value]) => [decodeCorePath(key), value]));
  return { success: true, response: decodedRules, etag: result.etag };
}

/** Writes a folder's rules via create+approve (design D1). */
export async function updateRulesCore(
  token: Token,
  targetFolder: string,
  rules: DialRule[],
): Promise<ServerActionResponse> {
  return createAndApprovePublication(token, targetFolder, [], rules as CorePublicationRule[]);
}

/**
 * Deletes (unpublishes) a folder for a set of resource types: gathers every resource URL under
 * it across only the targeted types, publishes a DELETE-action publication for them, approves
 * it, then best-effort deletes the folder from each targeted type's own storage. That final
 * cleanup step swallows every exception — a documented workaround for Azure Blob Storage's
 * hierarchical-namespace empty-folder semantics (design D6) — so a cleanup failure must never
 * fail the overall folder delete.
 */
export async function removeFolderCore(
  token: Token,
  path: string,
  resourceTypes: ResourceType[],
): Promise<ServerActionResponse> {
  const urlLists = await Promise.all(
    resourceTypes.map((type) => gatherResourceUrls(readRecursiveMetadata(token, type), path)),
  );
  const resources: CorePublicationResource[] = urlLists
    .flat()
    .map((url) => ({ action: CoreResourceAction.DELETE, targetUrl: url }));

  const publishResult = await createAndApprovePublication(token, path, resources);
  if (!publishResult.success) {
    return publishResult;
  }

  await Promise.allSettled(
    resourceTypes.map((type) =>
      type === ResourceType.FILE
        ? filesCoreApi.deleteFile(token, path, DEFAULT_ETAG)
        : assetApi.delete(token, type, path, DEFAULT_ETAG),
    ),
  );

  return { success: true };
}

/**
 * Recursively walks a Skill grouping folder, collecting every skill and every nested `.dial-folder`
 * marker found at any depth. A skill's own path resolves to an ITEM row here — its internal files are
 * never surfaced by this listing (Core's `nodeMetadata()` only ever returns marker nodes), so this walk
 * naturally treats each skill as one atomic leaf and never descends into its bundle.
 */
async function walkSkillFolder(token: Token, path: string): Promise<{ skillPaths: string[]; folderPaths: string[] }> {
  const skillPaths: string[] = [];
  const folderPaths: string[] = [];

  const walkLevel = async (levelPath: string): Promise<void> => {
    let nextToken: string | undefined;
    do {
      const node = await skillsCoreApi.listSkillMetadata(token, levelPath, { nextToken });
      const rows = toSkillList(node);
      for (const row of rows) {
        if (row.nodeType === DialFileNodeType.FOLDER) {
          folderPaths.push(row.path);
          await walkLevel(addTrailingSlash(row.path));
        } else {
          skillPaths.push(row.path);
        }
      }
      nextToken = node?.nextToken;
    } while (nextToken);
  };

  await walkLevel(path);
  return { skillPaths, folderPaths };
}

/**
 * Deletes (recursively) a Skill grouping folder — the SKILL-specific counterpart to
 * {@link removeFolderCore}, kept separate rather than folded into `ALL_TYPES`: Skills are
 * folder-shaped resources with their own dedicated v2 endpoints (`skills.md`), not flat resources
 * addressable through the generic publication-based delete every other type uses. Deletes bottom-up
 * — every skill first (order-independent, they're atomic units), then every nested `.dial-folder`
 * marker deepest-first, then the target folder itself — since Core rejects a non-empty folder marker
 * delete with a conflict. Every delete is unconditional (`If-Match: *`), matching how
 * {@link removeFolderCore}'s own folder-marker cleanup step already treats a folder delete as
 * best-effort rather than requiring a real etag per item.
 */
export async function removeSkillFolderCore(token: Token, path: string): Promise<ServerActionResponse> {
  const { skillPaths, folderPaths } = await walkSkillFolder(token, path);

  for (const skillPath of skillPaths) {
    const result = await skillsCoreApi.deleteSkill(token, skillPath, DEFAULT_ETAG);
    if (!result.success) {
      return result;
    }
  }

  const deepestFirstFolders = [...folderPaths].sort((a, b) => b.split('/').length - a.split('/').length);
  for (const folderPath of [...deepestFirstFolders, removeTrailingSlash(path)]) {
    const result = await skillsCoreApi.deleteSkillFolder(token, folderPath, DEFAULT_ETAG);
    if (!result.success) {
      return result;
    }
  }

  return { success: true };
}

/**
 * Moves a folder for a set of resource types: validates existence in every targeted type
 * before mutating anything, copies rules to the destination, then moves each type's resources
 * sequentially, fail-fast, with no rollback of types already moved (design D5 — a real BE
 * limitation, ported as-is, not hardened).
 */
export async function changeFolderCore(
  token: Token,
  oldPath: string,
  newPath: string,
  resourceTypes: ResourceType[],
  overwrite = false,
): Promise<ServerActionResponse> {
  for (const type of resourceTypes) {
    if (!(await folderExists(token, type, oldPath))) {
      return {
        success: false,
        errorHeader: 'Not Found',
        errorMessage: `Folder "${oldPath}" does not exist for resource type ${type}`,
      };
    }
  }

  const rulesResult = await getRulesCore(token, oldPath);
  if (rulesResult.success && rulesResult.response) {
    const flatRules = Object.values(rulesResult.response).flat();
    if (flatRules.length > 0) {
      const copyResult = await updateRulesCore(token, newPath, flatRules);
      if (!copyResult.success) {
        return copyResult;
      }
    }
  }

  for (const type of resourceTypes) {
    const prefix = RESOURCE_TYPE_PREFIX[type];
    const urls = await gatherResourceUrls(readRecursiveMetadata(token, type), oldPath);
    for (const url of urls) {
      const barePath = decodeCorePath(stripPrefix(url, prefix));
      let destinationPath: string;
      try {
        destinationPath = replacePathPrefix(barePath, oldPath, newPath);
      } catch (error) {
        return {
          success: false,
          errorHeader: 'Error',
          errorMessage: error instanceof Error ? error.message : `Cannot move "${barePath}"`,
        };
      }
      const moveResult = await assetApi.move(token, type, barePath, destinationPath, overwrite);
      if (!moveResult.success) {
        return moveResult;
      }
    }
  }

  return { success: true };
}
