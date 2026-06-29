import {
  APPLICATIONS_PREFIX,
  CONVERSATIONS_PREFIX,
  FILES_PREFIX,
  PROMPTS_PREFIX,
  TOOLSETS_PREFIX,
} from '@/src/constants/publications-core';
import { ResourceType } from '@/src/types/resource-type';
import { PublicationTypeConfig } from './types';

/**
 * Per-resource-type configuration driving publication resolution. Replaces the
 * five near-identical backend resolver classes with one config each.
 */
export const PUBLICATION_TYPE_REGISTRY: Record<ResourceType, PublicationTypeConfig> = {
  [ResourceType.APPLICATION]: {
    resourceType: ResourceType.APPLICATION,
    prefix: APPLICATIONS_PREFIX,
    resourceKey: 'applicationResources',
    assetKey: 'applicationResource',
    hasFiles: true,
    notFoundMessage: 'Application not found',
    alreadyExistsMessage: 'Target application already exists',
  },
  [ResourceType.CONVERSATION]: {
    resourceType: ResourceType.CONVERSATION,
    prefix: CONVERSATIONS_PREFIX,
    resourceKey: 'conversations',
    assetKey: 'conversation',
    hasFiles: true,
    notFoundMessage: 'Conversation not found',
    alreadyExistsMessage: 'Target conversation already exists',
  },
  [ResourceType.PROMPT]: {
    resourceType: ResourceType.PROMPT,
    prefix: PROMPTS_PREFIX,
    resourceKey: 'prompts',
    assetKey: 'prompt',
    hasFiles: false,
    notFoundMessage: 'Prompt not found',
    alreadyExistsMessage: 'Target prompt already exists',
  },
  [ResourceType.TOOLSET]: {
    resourceType: ResourceType.TOOLSET,
    prefix: TOOLSETS_PREFIX,
    resourceKey: 'toolSetResources',
    assetKey: 'toolSetResource',
    hasFiles: true,
    notFoundMessage: 'Toolset not found',
    alreadyExistsMessage: 'Target toolset already exists',
  },
  [ResourceType.FILE]: {
    resourceType: ResourceType.FILE,
    prefix: FILES_PREFIX,
    resourceKey: 'files',
    assetKey: 'file',
    hasFiles: false,
    notFoundMessage: 'File not found',
    alreadyExistsMessage: 'Target file already exists',
  },
};
