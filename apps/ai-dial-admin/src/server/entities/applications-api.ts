import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Token } from '@/src/models/auth';
import { DialApplication } from '@/src/models/dial/application';
import { Tool } from '@/src/models/dial/toolset';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const APPLICATIONS_URL = `${API}/applications`;
export const APPLICATION_URL = (name?: string) => `${APPLICATIONS_URL}/${name || ''}`;
export const TOOLS_URL = (name: string) => `${APPLICATION_URL(name)}/discovered-tools`;
export const TOOLS_TRY_OUT_URL = (name: string) => `${APPLICATION_URL(name)}/call-tool`;
export const CORE_APPLICATION_URL = (name: string) => `${APPLICATIONS_URL}/core/${name}`;

export class ApplicationsApi extends BaseApi {
  getApplicationsList(token: Token): Promise<DialApplication[] | null> {
    return this.get(APPLICATIONS_URL, token);
  }

  getApplicationsListAction(token: Token): Promise<ServerActionResponse<DialApplication[]>> {
    return this.getAction(APPLICATIONS_URL, token);
  }

  getApplication(name: string, token: Token, eTag: string) {
    return this.getActionWithEtag(APPLICATION_URL(name), eTag, token);
  }

  getTools(name: string, token: Token): Promise<ServerActionResponse<{ tools: Tool[] }>> {
    return this.getAction(TOOLS_URL(name), token);
  }

  tryOutTool(
    name: string,
    body: Record<string, unknown>,
    token: Token,
  ): Promise<ServerActionResponse<Record<string, unknown>>> {
    return this.postAction(TOOLS_TRY_OUT_URL(name), body, token);
  }

  removeApplication(token: Token, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(APPLICATION_URL(name), token);
  }

  createApplication(application: DialApplication, token: Token): Promise<ServerActionResponse> {
    return this.postAction(APPLICATIONS_URL, application, token);
  }

  updateApplication(application: DialApplication, token: Token, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(
      APPLICATION_URL(encodeURIComponent(application.name || '')),
      application,
      token,
      eTag,
    );
  }

  getCoreApplication(name: string, token: Token) {
    return this.getActionWithEtag(CORE_APPLICATION_URL(name), DEFAULT_ETAG, token);
  }

  updateCoreApplication(app: DialApplication, name: string, eTag: string, token: Token): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_APPLICATION_URL(encodeURIComponent(name)), app, token, eTag);
  }
}
