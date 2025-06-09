import { JWT } from 'next-auth/jwt';

import { DialApplication } from '@/src/models/dial/application';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { ServerActionResponse } from '@/src/models/server-action';

export const APPLICATIONS_URL = `${API}/applications`;
export const APPLICATION_URL = (name?: string) => `${APPLICATIONS_URL}/${name}`;

export class ApplicationsApi extends BaseApi {
  getApplicationsList(token: JWT | null): Promise<DialApplication[] | null> {
    return this.get(APPLICATIONS_URL, token);
  }

  getApplication(name: string, token: JWT | null): Promise<DialApplication | null> {
    return this.get(APPLICATION_URL(name), token);
  }

  removeApplication(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(APPLICATION_URL(name), token);
  }

  createApplication(application: DialApplication, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(APPLICATIONS_URL, application, token);
  }

  updateApplication(application: DialApplication, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(APPLICATION_URL(application.name), application, token);
  }
}
