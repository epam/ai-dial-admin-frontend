export interface DialFile {
  bucket?: string;
  contentLength?: number;
  contentType?: string;
  nodeType: DialFileNodeType;
  parentPath?: string | null;
  resourceType?: DialFileResourceType;
  updatedAt?: string;
  createdAt?: string;
  url?: string;
  children?: DialFile[];
  items?: DialFile[];
  path: string;
  name?: string;
  folderId: string;
  updateTime: string;
  author?: string;
  nextToken?: string;
  extension?: string;
  id?: string;
}

export enum DialFileNodeType {
  ITEM = 'item',
  FOLDER = 'folder',
}

export enum DialFileResourceType {
  FILE = 'FILE',
}
