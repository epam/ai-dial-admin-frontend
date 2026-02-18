import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { Token } from '@/src/models/auth';
import { Publication } from '@/src/models/dial/publications';
import { ServerActionResponse } from '@/src/models/server-action';

export const PUBLICATIONS_BASE_URL = `${API}/publications`;
export const PUBLICATIONS_PROMPTS_URL = `${PUBLICATIONS_BASE_URL}?type=prompt`;
export const PUBLICATIONS_FILES_URL = `${PUBLICATIONS_BASE_URL}?type=file`;
export const PUBLICATIONS_APPLICATION_URL = `${PUBLICATIONS_BASE_URL}?type=application`;
export const PUBLICATIONS_TOOLSET_URL = `${PUBLICATIONS_BASE_URL}?type=tool_set`;
export const PUBLICATION_GET_URL = `${PUBLICATIONS_BASE_URL}/get`;
export const PUBLICATION_REJECT_URL = `${PUBLICATIONS_BASE_URL}/reject`;
export const PUBLICATION_APPROVE_URL = `${PUBLICATIONS_BASE_URL}/approve`;
export const PUBLICATION_DELETE_URL = `${PUBLICATIONS_BASE_URL}/delete`;

export class PublicationsApi extends BaseApi {
  getApplicationPublicationsList(token: Token | undefined): Promise<Publication[] | undefined> {
    return this.getPublicationsList(PUBLICATIONS_APPLICATION_URL, token);
  }

  getToolsetPublicationsList(token: Token | undefined): Promise<Publication[] | undefined> {
    return this.getPublicationsList(PUBLICATIONS_TOOLSET_URL, token);
  }

  getPublicationsPromptsList(token: Token | undefined): Promise<Publication[] | undefined> {
    return this.getPublicationsList(PUBLICATIONS_PROMPTS_URL, token);
  }

  getPublicationsFilesList(token: Token | undefined): Promise<Publication[] | undefined> {
    return this.getPublicationsList(PUBLICATIONS_FILES_URL, token);
  }

  getPublicationsList(url: string, token: Token | undefined): Promise<Publication[] | undefined> {
    return this.get<{ publications: Publication[] }>(url, token).then((data) => (data ? data.publications : void 0));
  }

  getPublication(token: Token | undefined, path: string): Promise<Publication | null> {
    return this.post(PUBLICATION_GET_URL, { path }, token);
  }

  declinePublication(token: Token | undefined, path: string, comment?: string): Promise<ServerActionResponse> {
    return this.postAction(PUBLICATION_REJECT_URL, { path, comment }, token);
  }

  approvePublication(token: Token | undefined, path: string): Promise<ServerActionResponse> {
    return this.postAction(PUBLICATION_APPROVE_URL, { path }, token);
  }

  deletePublication(token: Token | undefined, path: string): Promise<ServerActionResponse> {
    return this.postAction(PUBLICATION_DELETE_URL, { path }, token);
  }
}
