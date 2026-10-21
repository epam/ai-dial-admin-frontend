import { FOLDER_NESTED_VERSIONLESS_TYPES } from '@/src/constants/assets-core';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { FILES_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import {
  ActionType,
  Publication,
  PublicationFile,
  PublicationStatus,
  ResourceIssue,
} from '@/src/models/dial/publications';
import { ResourceType } from '@/src/types/resource-type';
import {
  coreActionToActionType,
  derivePublicationAction,
  mapPublicationBase,
  resolvePublicationResourceType,
} from '../mappers';
import { CorePublication, CorePublicationResource, CoreResourceAction } from '../models';
import { parseEncodedFolderPath, parseEncodedVersionedPath } from '../path';
import { enrichFileResource } from './file-resource';
import { PUBLICATION_TYPE_REGISTRY } from './registry';
import { enrichSkillResource } from './skill-resource';
import { EnrichmentClients, PublicationTypeConfig } from './types';
import { resolveResourceUrl } from './url-resolver';

type ResourceWrapper = Record<string, unknown>;

/**
 * Decodes a publication resource URL to the bare asset path. Folder-nested versionless types
 * (prompt/conversation) parse with folder semantics so a `__` in the name is never split;
 * versioned types (application/toolset) keep the `__version`-aware parse.
 */
const parseResourceAssetPath = (url: string, config: PublicationTypeConfig): string =>
  FOLDER_NESTED_VERSIONLESS_TYPES.has(config.resourceType)
    ? parseEncodedFolderPath(url, config.prefix).path
    : parseEncodedVersionedPath(url, config.prefix).path;

const enrichAssetResource = async (
  resource: CorePublicationResource,
  status: PublicationStatus,
  config: PublicationTypeConfig,
  token: Token,
  clients: EnrichmentClients,
  issues: ResourceIssue[],
): Promise<ResourceWrapper | null> => {
  if (status === PublicationStatus.PENDING && resource.action !== CoreResourceAction.DELETE) {
    const targetPath = parseResourceAssetPath(resource.targetUrl ?? '', config);
    const existing = await clients.getAsset(token, targetPath, config.resourceType, DEFAULT_ETAG);
    if (existing.success && existing.response) {
      issues.push({
        resourceType: config.resourceType,
        path: resource.targetUrl ?? '',
        message: config.alreadyExistsMessage,
      });
      return null;
    }
  }

  const assetPath = parseResourceAssetPath(resolveResourceUrl(resource, status), config);
  const res = await clients.getAsset(token, assetPath, config.resourceType, DEFAULT_ETAG);
  if (!res.success || !res.response) {
    issues.push({ resourceType: config.resourceType, path: assetPath, message: config.notFoundMessage });
    return null;
  }

  return {
    sourceUrl: resource.sourceUrl ?? '',
    targetUrl: resource.targetUrl ?? '',
    reviewUrl: resource.reviewUrl ?? '',
    action: coreActionToActionType(resource.action),
    [config.assetKey]: res.response,
  };
};

/** Dispatches a primary resource to its type's enrichment shape (metadata-only for FILE/SKILL, asset body otherwise). */
const enrichPrimaryResource = (
  resource: CorePublicationResource,
  status: PublicationStatus,
  config: PublicationTypeConfig,
  token: Token,
  clients: EnrichmentClients,
  issues: ResourceIssue[],
) => {
  if (config.resourceType === ResourceType.FILE) {
    return enrichFileResource(resource, status, token, clients, issues);
  }
  if (config.resourceType === ResourceType.SKILL) {
    return enrichSkillResource(resource, status, token, clients, issues);
  }
  return enrichAssetResource(resource, status, config, token, clients, issues);
};

/**
 * Resolves a Core publication into the enriched FE `Publication`: partitions
 * resources by type, enriches each (asset body or file metadata), and collects
 * not-found / already-exists issues instead of failing. Mirrors the backend
 * per-type resolvers; `getPublication` only ever resolves PENDING publications.
 */
export const resolvePublication = async (
  core: CorePublication,
  token: Token,
  clients: EnrichmentClients,
): Promise<Publication> => {
  const resourceType = resolvePublicationResourceType(core.resourceTypes);
  if (!resourceType) {
    throw new Error('Unable to resolve publication resource type');
  }

  const config = PUBLICATION_TYPE_REGISTRY[resourceType];
  const status = core.status;
  const allResources = core.resources ?? [];
  const issues: ResourceIssue[] = [];

  const primaryResources = allResources.filter((resource) =>
    resolveResourceUrl(resource, status).startsWith(config.prefix),
  );
  const fileResources = config.hasFiles
    ? allResources.filter((resource) => resolveResourceUrl(resource, status).startsWith(FILES_PREFIX))
    : [];

  const resourceWrappers: ResourceWrapper[] = [];
  for (const resource of primaryResources) {
    const wrapper = await enrichPrimaryResource(resource, status, config, token, clients, issues);
    if (wrapper) {
      resourceWrappers.push(wrapper as ResourceWrapper);
    }
  }

  const fileWrappers: PublicationFile[] = [];
  for (const resource of fileResources) {
    const wrapper = await enrichFileResource(resource, status, token, clients, issues);
    if (wrapper) {
      fileWrappers.push(wrapper as PublicationFile);
    }
  }

  const publication: Publication = {
    ...mapPublicationBase(core),
    action: derivePublicationAction(primaryResources, resourceType) as ActionType,
    resourceIssues: issues,
    [config.resourceKey]: resourceWrappers,
  };
  if (config.hasFiles) {
    publication.files = fileWrappers;
  }

  return publication;
};
