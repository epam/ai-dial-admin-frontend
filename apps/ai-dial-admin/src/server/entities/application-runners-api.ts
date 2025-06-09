import { JWT } from 'next-auth/jwt';

import { DialApplicationScheme } from '@/src/models/dial/application';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { ServerActionResponse } from '@/src/models/server-action';

export const APPLICATION_SCHEMES_URL = `${API}/applicationTypeSchemas`;
export const APPLICATION_SCHEME_URL = (id?: string) => `${APPLICATION_SCHEMES_URL}?id=${id}`;

export class ApplicationRunnersApi extends BaseApi {
  getApplicationSchemesList(token: JWT | null): Promise<DialApplicationScheme[] | null> {
    return this.get(APPLICATION_SCHEMES_URL, token);
  }

  getApplicationScheme(name: string, token: JWT | null): Promise<DialApplicationScheme | null | undefined> {
    return this.get(APPLICATION_SCHEME_URL(name), token).then((res) => (res as DialApplicationScheme[])?.[0]);
  }

  removeApplicationScheme(token: JWT | null, id?: string): Promise<ServerActionResponse> {
    return this.deleteAction(APPLICATION_SCHEME_URL(id), token);
  }

  createApplicationScheme(scheme: DialApplicationScheme, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(APPLICATION_SCHEMES_URL, scheme, token);
  }

  updateApplicationScheme(scheme: DialApplicationScheme, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(APPLICATION_SCHEME_URL(scheme.$id), scheme, token);
  }
}
