export interface DialApplicationResource {
  descriptionKeywords: string[];
  inputAttachmentTypes: string[];
  dependencies: string[];
  interceptors: string[];
  path: string;
  folderId: string;
  version: string;
  name: string;
  author: string;
  endpoint: string;
  displayName: string;
  displayVersion: string;
  description: string;
  iconUrl: string;
  reference: string;
  updateTime: number;
  createdAt: number;
  maxRetryAttempts: number;
  forwardAuthToken: boolean;
  editorUrl: string;
  viewerUrl: string;
}
