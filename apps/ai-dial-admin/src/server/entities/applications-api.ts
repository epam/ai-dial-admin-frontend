import { JWT } from 'next-auth/jwt';

import { DialApplication } from '@/src/models/dial/application';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { ServerActionResponse } from '@/src/models/server-action';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';

export const APPLICATIONS_URL = `${API}/applications`;
export const APPLICATION_URL = (name?: string) => `${APPLICATIONS_URL}/${name}`;
export const CORE_APPLICATION_URL = (name?: string) => `${APPLICATIONS_URL}/core/${name}`;

export class ApplicationsApi extends BaseApi {
  getApplicationsList(token: JWT | null): Promise<DialApplication[] | null> {
    return this.get(APPLICATIONS_URL, token);
  }

  getApplication(name: string, token: JWT | null, eTag: string) {
    return this.getActionWithEtag(APPLICATION_URL(name), eTag || DEFAULT_ETAG, token);
  }

  removeApplication(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(APPLICATION_URL(name), token);
  }

  createApplication(application: DialApplication, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(APPLICATIONS_URL, application, token);
  }

  updateApplication(application: DialApplication, token: JWT | null, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(
      APPLICATION_URL(encodeURIComponent(application.name || '')),
      application,
      token,
      eTag,
    );
  }

  getCoreApplication(name: string, token: JWT | null) {
    return this.getActionWithEtag(CORE_APPLICATION_URL(name), DEFAULT_ETAG, token);
  }

  updateCoreApplication(
    app: DialApplication,
    name: string,
    eTag: string,
    token: JWT | null,
  ): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_APPLICATION_URL(encodeURIComponent(name || '')), app, token, eTag);
  }
}
