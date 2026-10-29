import { PROJECTS_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { PublicationProject, PublicationStatus, ResourceIssue } from '@/src/models/dial/publications';
import { ResourceType } from '@/src/types/resource-type';
import { coreActionToActionType } from '../mappers';
import { CorePublicationResource, CoreResourceAction } from '../models';
import { decodeCorePath, stripPrefix } from '../path';
import { EnrichmentClients } from './types';
import { resolveResourceUrl } from './url-resolver';

const projectIssue = (path: string, message: string): ResourceIssue => ({
  resourceType: ResourceType.PROJECT,
  path,
  message,
});

/**
 * Enriches a single project resource with its Core folder metadata, collecting issues. Mirrors
 * `enrichFileResource` and `enrichSkillResource` — metadata-only, no content/ZIP fetch — since a project has no single-document
 * body to merge the way the four versioned types do.
 */
export const enrichProjectResource = async (
  resource: CorePublicationResource,
  status: PublicationStatus,
  token: Token,
  clients: EnrichmentClients,
  issues: ResourceIssue[],
): Promise<PublicationProject | null> => {
  if (status === PublicationStatus.PENDING && resource.action !== CoreResourceAction.DELETE) {
    const targetPath = decodeCorePath(stripPrefix(resource.targetUrl ?? '', PROJECTS_PREFIX));
    if (await clients.getProjectMetadata(token, targetPath)) {
      issues.push(projectIssue(resource.targetUrl ?? '', 'Target project already exists'));
      return null;
    }
  }

  const projectPath = decodeCorePath(stripPrefix(resolveResourceUrl(resource, status), PROJECTS_PREFIX));
  const projectResource = await clients.getProjectMetadata(token, projectPath);
  if (!projectResource) {
    issues.push(projectIssue(projectPath, 'Project not found'));
    return null;
  }

  return {
    sourceUrl: resource.sourceUrl ?? '',
    targetUrl: resource.targetUrl ?? '',
    reviewUrl: resource.reviewUrl ?? '',
    action: coreActionToActionType(resource.action),
    projectResource,
  };
};
