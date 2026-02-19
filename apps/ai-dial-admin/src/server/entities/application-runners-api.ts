import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Token } from '@/src/models/auth';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const APPLICATION_SCHEMES_URL = `${API}/applicationTypeSchemas`;
export const APPLICATION_SCHEME_URL = (id?: string) => `${APPLICATION_SCHEMES_URL}?id=${id}`;
export const CORE_APPLICATION_SCHEME_URL = (id: string) => `${APPLICATION_SCHEMES_URL}/core?id=${id}`;

export class ApplicationRunnersApi extends BaseApi {
  getApplicationSchemesList(token: Token): Promise<DialApplicationScheme[] | null> {
    return this.get(APPLICATION_SCHEMES_URL, token);
  }

  getApplicationScheme(name: string, token: Token, etag: string) {
    return this.getActionWithEtag(APPLICATION_SCHEME_URL(name), etag, token);
  }

  removeApplicationScheme(token: Token, id?: string): Promise<ServerActionResponse> {
    return this.deleteAction(APPLICATION_SCHEME_URL(id), token);
  }

  createApplicationScheme(scheme: DialApplicationScheme, token: Token): Promise<ServerActionResponse> {
    return this.postAction(APPLICATION_SCHEMES_URL, scheme, token);
  }

  updateApplicationScheme(scheme: DialApplicationScheme, token: Token, etag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(APPLICATION_SCHEME_URL(encodeURIComponent(scheme.$id || '')), scheme, token, etag);
  }

  getCoreRunner(name: string, token: Token): Promise<ServerActionResponse<DialApplicationScheme>> {
    return this.getActionWithEtag(CORE_APPLICATION_SCHEME_URL(name), DEFAULT_ETAG, token);
  }

  updateCoreRunner(
    scheme: DialApplicationScheme,
    id: string,
    etag: string,
    token: Token,
  ): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_APPLICATION_SCHEME_URL(encodeURIComponent(id)), scheme, token, etag);
  }
}
