import { Token } from '@/src/models/auth';
import { ChatCompletionResponse, QueryAssistantMessage } from '@/src/models/analytics/query-assistant';
import { ServerActionResponse } from '@/src/models/server-action';
import { CoreApi } from './core-api';

const API_VERSION = '2024-10-21';

export class QueryAssistantApi extends CoreApi {
  chatCompletion(
    messages: QueryAssistantMessage[],
    deployment: string,
    token: Token,
  ): Promise<ServerActionResponse<ChatCompletionResponse>> {
    const url = `openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${API_VERSION}`;
    return this.postAction(url, { messages, stream: false }, token) as Promise<
      ServerActionResponse<ChatCompletionResponse>
    >;
  }
}
