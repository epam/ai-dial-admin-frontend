import { ResourceType } from '@/src/types/resource-type';
import { API } from '../../api';

export enum ResourceOperation {
  LIST = 'list',
  GET = 'get',
  CREATE = 'create',
  DELETE = 'delete',
  DELETE_BULK = 'delete/bulk',
  MOVE = 'move',
  EXPORT = 'export',
  EXPORT_JSON = 'export/json',
  IMPORT = 'import',
  IMPORT_ZIP = 'import/zip',
  IMPORT_JSON = 'import/json',
  DOWNLOAD = 'download',
  UPDATE = 'update',
}

export const ResourceBasePaths: Record<ResourceType, string> = {
  [ResourceType.PROMPT]: `${API}/prompts`,
  [ResourceType.FILE]: `${API}/files`,
  [ResourceType.APPLICATION]: `${API}/application-resources`,
  [ResourceType.TOOLSET]: `${API}/toolset-resources`,
  [ResourceType.CONVERSATION]: `${API}/conversations`,
};
