import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { encodeCorePath } from '@/src/server/publications/path';
import { CoreApi } from './core-api';

const getConsentUrl = (appPath: string, serviceId: string): string =>
  `v1/applications/${encodeCorePath(appPath)}/external-services/${encodeURIComponent(serviceId)}/consent`;

export class ExternalServiceConsentApi extends CoreApi {
  grant(token: Token, appPath: string, serviceId: string): Promise<ServerActionResponse> {
    return this.sendActionRequest(getConsentUrl(appPath, serviceId), 'POST', token);
  }

  withdraw(token: Token, appPath: string, serviceId: string): Promise<ServerActionResponse> {
    return this.sendActionRequest(getConsentUrl(appPath, serviceId), 'DELETE', token);
  }
}
