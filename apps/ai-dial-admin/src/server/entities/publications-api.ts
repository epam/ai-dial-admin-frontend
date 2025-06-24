import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { JWT } from 'next-auth/jwt';
import { Publication } from '@/src/models/dial/publications';
import { ServerActionResponse } from '@/src/models/server-action';

export const PUBLICATIONS_BASE_URL = `${API}/publications`;
export const PUBLICATIONS_PROMPTS_URL = `${PUBLICATIONS_BASE_URL}?type=prompt`;
export const PUBLICATIONS_FILES_URL = `${PUBLICATIONS_BASE_URL}?type=file`;
export const PUBLICATION_GET_URL = `${PUBLICATIONS_BASE_URL}/get`;
export const PUBLICATION_REJECT_URL = `${PUBLICATIONS_BASE_URL}/reject`;
export const PUBLICATION_APPROVE_URL = `${PUBLICATIONS_BASE_URL}/approve`;

export class PublicationsApi extends BaseApi {
  getPublicationsPromptsList(token: JWT | null): Promise<Publication[] | undefined> {
    return this.get(PUBLICATIONS_PROMPTS_URL, token).then((data) =>
      data ? (data as { publications: Publication[] }).publications : void 0,
    );
  }

  getPublicationsFilesList(token: JWT | null): Promise<Publication[] | undefined> {
    return this.get(PUBLICATIONS_FILES_URL, token).then((data) =>
      data ? (data as { publications: Publication[] }).publications : void 0,
    );
  }

  getPublication(token: JWT | null, path: string): Promise<Publication | null> {
    return this.post(PUBLICATION_GET_URL, { path }, token);
  }

  declinePublication(token: JWT | null, path: string, comment?: string): Promise<ServerActionResponse> {
    return this.postAction(PUBLICATION_REJECT_URL, { path, comment }, token);
  }

  approvePublication(token: JWT | null, path: string): Promise<ServerActionResponse> {
    return this.postAction(PUBLICATION_APPROVE_URL, { path }, token);
  }
}
