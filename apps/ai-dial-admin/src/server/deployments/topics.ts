import { JWT } from 'next-auth/jwt';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { ServerActionResponse } from '@/src/models/server-action';
export const BASE_TOPICS_URL = `${API}/topics`;

export class TopicApi extends BaseApi {
  getTopics(token: JWT | null): Promise<ServerActionResponse> {
    return this.getAction(BASE_TOPICS_URL, token);
  }
}
