import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const BASE_TOPICS_URL = `${API}/topics`;

export class TopicApi extends BaseApi {
  getTopics(token: Token | undefined): Promise<ServerActionResponse> {
    return this.getAction(BASE_TOPICS_URL, token);
  }
}
