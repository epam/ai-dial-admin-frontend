import { Token } from '@/src/models/auth';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const GLOBAL_FIREWALL_BASE_URL = `${API}/global-whitelist/image-build`;
export const GLOBAL_FIREWALL_REVISION_URL = (revision: number) => `${GLOBAL_FIREWALL_BASE_URL}/revision/${revision}`;

export class GlobalFirewallApi extends BaseApi {
  getRevisionDetails(revision: number, token: Token): Promise<string[] | null> {
    return this.get(GLOBAL_FIREWALL_REVISION_URL(revision), token);
  }
}
