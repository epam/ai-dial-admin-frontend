import { ResourceType } from '@/src/types/resource-type';
import { CoreResourceMetadataNode, ResourceInfo, toResourceInfoList } from './asset-metadata';

/**
 * Flattens a Project folder-listing node's children into list rows, through the same shared row mapper every
 * other asset type uses — see `toSkillList`.
 */
export const toProjectList = (node: CoreResourceMetadataNode | null): ResourceInfo[] =>
  toResourceInfoList(node, ResourceType.PROJECT);
