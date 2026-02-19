import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const IMAGES_WHITELIST = `${API}/global-whitelist/image-build`;

export class WhitelistApi extends BaseApi {
  getGlobalWhitelist(token: Token): Promise<ServerActionResponse> {
    return this.getAction(IMAGES_WHITELIST, token);
  }

  updateGlobalWhitelist(domains: string[], token: Token): Promise<ServerActionResponse> {
    return this.postAction(IMAGES_WHITELIST, domains, token);
  }
}
