import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Token } from '@/src/models/auth';
import { DialApplication } from '@/src/models/dial/application';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const APPLICATIONS_URL = `${API}/applications`;
export const APPLICATION_URL = (name?: string) => `${APPLICATIONS_URL}/${name || ''}`;
export const CORE_APPLICATION_URL = (name: string) => `${APPLICATIONS_URL}/core/${name}`;

export class ApplicationsApi extends BaseApi {
  getApplicationsList(token: Token | undefined): Promise<DialApplication[] | null> {
    return this.get(APPLICATIONS_URL, token);
  }

  getApplicationsListAction(token: Token | undefined): Promise<ServerActionResponse<DialApplication[]>> {
    return this.getAction(APPLICATIONS_URL, token);
  }

  getApplication(name: string, token: Token | undefined, eTag: string) {
    return this.getActionWithEtag(APPLICATION_URL(name), eTag, token);
  }

  removeApplication(token: Token | undefined, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(APPLICATION_URL(name), token);
  }

  createApplication(application: DialApplication, token: Token | undefined): Promise<ServerActionResponse> {
    return this.postAction(APPLICATIONS_URL, application, token);
  }

  updateApplication(
    application: DialApplication,
    token: Token | undefined,
    eTag: string,
  ): Promise<ServerActionResponse> {
    return this.putActionWithEtag(
      APPLICATION_URL(encodeURIComponent(application.name || '')),
      application,
      token,
      eTag,
    );
  }

  getCoreApplication(name: string, token: Token | undefined) {
    return this.getActionWithEtag(CORE_APPLICATION_URL(name), DEFAULT_ETAG, token);
  }

  updateCoreApplication(
    app: DialApplication,
    name: string,
    eTag: string,
    token: Token | undefined,
  ): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_APPLICATION_URL(encodeURIComponent(name)), app, token, eTag);
  }
}
