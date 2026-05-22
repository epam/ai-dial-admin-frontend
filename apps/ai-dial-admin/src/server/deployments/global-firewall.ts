import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const GLOBAL_FIREWALL_BASE_URL = `${API}/global-whitelist/image-build`;
export const GLOBAL_FIREWALL_REVISION_URL = (revision: number) => `${GLOBAL_FIREWALL_BASE_URL}/revision/${revision}`;
export const GLOBAL_FIREWALL_ROLLBACK_URL = (revision: number) => `${GLOBAL_FIREWALL_REVISION_URL(revision)}/rollback`;

export class GlobalFirewallApi extends BaseApi {
  getRevisionDetails(revision: number, token: Token): Promise<string[] | null> {
    return this.get(GLOBAL_FIREWALL_REVISION_URL(revision), token);
  }

  rollbackToRevision(revision: number, token: Token): Promise<ServerActionResponse> {
    return this.postAction(GLOBAL_FIREWALL_ROLLBACK_URL(revision), {}, token);
  }
}
