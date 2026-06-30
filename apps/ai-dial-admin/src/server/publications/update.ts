import { FILES_PREFIX, PUBLICATIONS_PREFIX } from '@/src/constants/publications-core';
import { Publication, PublicationFile } from '@/src/models/dial/publications';
import { ResourceType } from '@/src/types/resource-type';
import { actionTypeToCore, mapRulesToCore, resourceTypeToCore } from './mappers';
import { CorePublicationResource, CorePublicationUpdateDto, CoreResourceType } from './models';
import { buildEncodedPath, encodeCorePath, encodeFolderPath, ensureTrailingSlash } from './path';
import { PUBLICATION_TYPE_REGISTRY } from './resolver/registry';

interface AssetLike {
  name?: string;
  version?: string;
}

interface ResourceWrapper {
  action: Publication['action'];
  sourceUrl?: string;
  targetUrl?: string;
  reviewUrl?: string;
  file?: { name?: string };
  [key: string]: unknown;
}

type FileResource = Pick<ResourceWrapper, 'action' | 'sourceUrl' | 'file'>;

export interface ResourcePut {
  asset: object;
  type: ResourceType;
}

export interface UpdatePlan {
  dto: CorePublicationUpdateDto;
  resourcePuts: ResourcePut[];
}

/** A publication carrying its per-type resource arrays, as posted from the View. */
type UpdatablePublication = Publication & {
  applicationResources?: ResourceWrapper[];
  conversations?: ResourceWrapper[];
  prompts?: ResourceWrapper[];
  toolSetResources?: ResourceWrapper[];
  files?: PublicationFile[];
};

const getPrimaryType = (publication: UpdatablePublication): ResourceType => {
  if (Array.isArray(publication.applicationResources)) {
    return ResourceType.APPLICATION;
  }
  if (Array.isArray(publication.conversations)) {
    return ResourceType.CONVERSATION;
  }
  if (Array.isArray(publication.prompts)) {
    return ResourceType.PROMPT;
  }
  if (Array.isArray(publication.toolSetResources)) {
    return ResourceType.TOOLSET;
  }
  return ResourceType.FILE;
};

const buildFileResource = (wrapper: FileResource, folderId: string): CorePublicationResource => ({
  action: actionTypeToCore(wrapper.action),
  sourceUrl: wrapper.sourceUrl,
  targetUrl: encodeCorePath(FILES_PREFIX + ensureTrailingSlash(folderId) + (wrapper.file?.name ?? '')),
});

/**
 * Builds the Core update payload and the per-resource PUT plan from a posted
 * publication. Recalculates every resource's target URL from the folder id
 * (mirrors each backend resolver's `updatePublicationResourceTargets`).
 */
export const buildUpdatePlan = (publication: UpdatablePublication): UpdatePlan => {
  const folderId = publication.folderId;
  const type = getPrimaryType(publication);
  const config = PUBLICATION_TYPE_REGISTRY[type];

  const resources: CorePublicationResource[] = [];
  const resourcePuts: ResourcePut[] = [];

  const primaryWrappers = (publication[config.resourceKey] as ResourceWrapper[] | undefined) ?? [];
  for (const wrapper of primaryWrappers) {
    if (type === ResourceType.FILE) {
      resources.push(buildFileResource(wrapper, folderId));
      continue;
    }
    const asset = wrapper[config.assetKey] as AssetLike;
    resources.push({
      action: actionTypeToCore(wrapper.action),
      sourceUrl: wrapper.sourceUrl,
      targetUrl: buildEncodedPath(config.prefix + ensureTrailingSlash(folderId), asset?.name ?? '', asset?.version),
    });
    resourcePuts.push({ asset: asset as object, type });
  }

  const fileWrappers = config.hasFiles ? (publication.files ?? []) : [];
  for (const wrapper of fileWrappers) {
    resources.push(buildFileResource(wrapper, folderId));
  }

  const resourceTypes: CoreResourceType[] =
    type === ResourceType.FILE ? [CoreResourceType.FILE] : [resourceTypeToCore(type)];
  if (config.hasFiles && fileWrappers.length > 0) {
    resourceTypes.push(CoreResourceType.FILE);
  }

  const dto: CorePublicationUpdateDto = {
    url: PUBLICATIONS_PREFIX + publication.path,
    name: publication.requestName,
    targetFolder: encodeFolderPath(folderId),
    resources,
    resourceTypes,
    rules: mapRulesToCore(publication.rules),
    displayAuthor: publication.displayAuthor,
  };

  return { dto, resourcePuts };
};
