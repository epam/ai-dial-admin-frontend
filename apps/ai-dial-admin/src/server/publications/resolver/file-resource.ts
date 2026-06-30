import { FILES_PREFIX, PUBLICATIONS_UPDATES_FOLDER } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { ActionType, PublicationFile, PublicationStatus, ResourceIssue } from '@/src/models/dial/publications';
import { ResourceType } from '@/src/types/resource-type';
import { coreActionToActionType } from '../mappers';
import { CorePublicationResource, CoreResourceAction } from '../models';
import { decodeCorePath, ensureTrailingSlash, parsePath, stripPrefix } from '../path';
import { EnrichmentClients } from './types';
import { resolveResourceUrl } from './url-resolver';

const fileIssue = (path: string, message: string): ResourceIssue => ({
  resourceType: ResourceType.FILE,
  path,
  message,
});

/** Enriches a single file resource with its Core metadata, collecting issues. */
export const enrichFileResource = async (
  resource: CorePublicationResource,
  status: PublicationStatus,
  token: Token,
  clients: EnrichmentClients,
  issues: ResourceIssue[],
): Promise<PublicationFile | null> => {
  if (status === PublicationStatus.PENDING && resource.action !== CoreResourceAction.DELETE) {
    const targetPath = decodeCorePath(stripPrefix(resource.targetUrl ?? '', FILES_PREFIX));
    if (await clients.getFileMetadata(token, targetPath)) {
      issues.push(fileIssue(resource.targetUrl ?? '', 'Target file already exists'));
      return null;
    }
  }

  const filePath = decodeCorePath(stripPrefix(resolveResourceUrl(resource, status), FILES_PREFIX));
  const meta = await clients.getFileMetadata(token, filePath);
  if (!meta) {
    issues.push(fileIssue(filePath, 'File not found'));
    return null;
  }

  const { name, folderId } = parsePath(filePath);
  const file: Partial<DialFile> = {
    name: meta.name ?? name,
    path: filePath,
    folderId,
    nodeType: DialFileNodeType.ITEM,
    contentLength: meta.contentLength,
    contentType: meta.contentType,
  };

  return {
    sourceUrl: resource.sourceUrl ?? '',
    targetUrl: resource.targetUrl ?? '',
    reviewUrl: resource.reviewUrl ?? '',
    action: coreActionToActionType(resource.action),
    file,
  };
};

/**
 * Uploads newly attached files to `{bucket}/publications_updates/` and returns the
 * corresponding ADD_IF_ABSENT file resources (mirrors `FilePublicationResolver.uploadNewFileResources`).
 */
export const uploadStagedFiles = async (
  files: File[],
  folderId: string,
  token: Token,
  clients: EnrichmentClients,
): Promise<PublicationFile[]> => {
  const bucket = await clients.getBucket(token);
  if (!bucket?.bucket) {
    throw new Error('Unable to resolve user bucket for publication file upload');
  }

  const sourceFolder = ensureTrailingSlash(bucket.bucket) + PUBLICATIONS_UPDATES_FOLDER;
  const uploaded: PublicationFile[] = [];

  for (const file of files) {
    const sourcePath = sourceFolder + file.name;
    const result = await clients.uploadFile(token, sourcePath, file);
    if (!result.success) {
      throw new Error(`Publication files upload failed: ${result.errorMessage ?? file.name}`);
    }
    uploaded.push({
      action: ActionType.ADD_IF_ABSENT,
      sourceUrl: FILES_PREFIX + sourcePath,
      targetUrl: FILES_PREFIX + ensureTrailingSlash(folderId) + file.name,
      reviewUrl: '',
      file: { name: file.name },
    });
  }

  return uploaded;
};
