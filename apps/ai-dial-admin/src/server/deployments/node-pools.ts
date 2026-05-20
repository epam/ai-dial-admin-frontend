import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const BASE_NODE_POOLS_URL = `${API}/node-pools`;

export class NodePoolsApi extends BaseApi {
  getNodePools(token: Token): Promise<ServerActionResponse> {
    return this.getAction(BASE_NODE_POOLS_URL, token);
  }
}
