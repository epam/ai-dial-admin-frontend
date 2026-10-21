import { ResourceType } from '@/src/types/resource-type';
import { CoreResourceMetadataNode, ResourceInfo, toResourceInfoList } from './asset-metadata';

/**
 * Flattens a Skill folder-listing node's children into list rows, through the same shared row
 * mapper every other asset type uses (`toResourceInfo`'s folder-nested-versionless branch handles
 * Skill's `/v2/metadata/skills` path parsing and FOLDER trailing-slash convention).
 */
export const toSkillList = (node: CoreResourceMetadataNode | null): ResourceInfo[] =>
  toResourceInfoList(node, ResourceType.SKILL);
