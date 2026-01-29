import { JWT } from 'next-auth/jwt';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { ServerActionResponse } from '@/src/models/server-action';

export const IMAGES_WHITELIST = `${API}/global-whitelist/image-build`;

export class WhitelistApi extends BaseApi {
  getGlobalWhitelist(token: JWT | null): Promise<ServerActionResponse> {
    return this.getAction(IMAGES_WHITELIST, token);
  }

  updateGlobalWhitelist(domains: string[], token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(IMAGES_WHITELIST, domains, token);
  }
}
