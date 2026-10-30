import { Token } from '@/src/models/auth';
import { AdminConsentStatus, ResourceAccess } from '@/src/models/dial/resource-dependency';
import { ServerActionResponse } from '@/src/models/server-action';
import { encodeCorePath } from '@/src/server/publications/path';
import { CoreApi } from './core-api';

interface CoreAdminConsentStatus extends Omit<AdminConsentStatus, 'grantedResources'> {
  grantedResources?: { url: string; access?: ResourceAccess[] }[];
}

const getAdminConsentUrl = (appPath: string): string =>
  `v1/consent/applications/${encodeCorePath(appPath)}/admin-consent`;

// Core names an approved target `url`; the declaration it mirrors calls the same value `path`.
export const toAdminConsentStatus = (status: CoreAdminConsentStatus): AdminConsentStatus => {
  const { grantedResources, ...rest } = status;
  return {
    ...rest,
    ...(grantedResources && {
      grantedResources: grantedResources.map(({ url, access }) => ({ path: url, access: access ?? [] })),
    }),
  };
};

export class AdminConsentApi extends CoreApi {
  async getStatus(token: Token, appPath: string): Promise<ServerActionResponse<AdminConsentStatus>> {
    const res = await this.getAction(getAdminConsentUrl(appPath), token);
    return res.success && res.response ? { ...res, response: toAdminConsentStatus(res.response) } : res;
  }

  grant(token: Token, appPath: string): Promise<ServerActionResponse> {
    return this.sendActionRequest(getAdminConsentUrl(appPath), 'POST', token);
  }

  withdraw(token: Token, appPath: string): Promise<ServerActionResponse> {
    return this.sendActionRequest(getAdminConsentUrl(appPath), 'DELETE', token);
  }
}
