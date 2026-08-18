import { SKILLS_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { PublicationSkill, PublicationStatus, ResourceIssue } from '@/src/models/dial/publications';
import { ResourceType } from '@/src/types/resource-type';
import { coreActionToActionType } from '../mappers';
import { CorePublicationResource, CoreResourceAction } from '../models';
import { decodeCorePath, stripPrefix } from '../path';
import { EnrichmentClients } from './types';
import { resolveResourceUrl } from './url-resolver';

const skillIssue = (path: string, message: string): ResourceIssue => ({
  resourceType: ResourceType.SKILL,
  path,
  message,
});

/**
 * Enriches a single skill resource with its Core folder metadata, collecting issues. Mirrors
 * `enrichFileResource` — metadata-only, no content/ZIP fetch — since a skill has no single-document
 * body to merge the way the four versioned types do.
 */
export const enrichSkillResource = async (
  resource: CorePublicationResource,
  status: PublicationStatus,
  token: Token,
  clients: EnrichmentClients,
  issues: ResourceIssue[],
): Promise<PublicationSkill | null> => {
  if (status === PublicationStatus.PENDING && resource.action !== CoreResourceAction.DELETE) {
    const targetPath = decodeCorePath(stripPrefix(resource.targetUrl ?? '', SKILLS_PREFIX));
    if (await clients.getSkillMetadata(token, targetPath)) {
      issues.push(skillIssue(resource.targetUrl ?? '', 'Target skill already exists'));
      return null;
    }
  }

  const skillPath = decodeCorePath(stripPrefix(resolveResourceUrl(resource, status), SKILLS_PREFIX));
  const skillResource = await clients.getSkillMetadata(token, skillPath);
  if (!skillResource) {
    issues.push(skillIssue(skillPath, 'Skill not found'));
    return null;
  }

  return {
    sourceUrl: resource.sourceUrl ?? '',
    targetUrl: resource.targetUrl ?? '',
    reviewUrl: resource.reviewUrl ?? '',
    action: coreActionToActionType(resource.action),
    skillResource,
  };
};
