import { JWT } from 'next-auth/jwt';

import { DialAssistant } from '@/src/models/dial/assistant';

import { API } from '../api';
import { BaseApi } from '../base-api';
import { ServerActionResponse } from '@/src/models/server-action';

export const ASSISTANTS_URL = `${API}/assistants`;
export const ASSISTANT_URL = (name?: string) => `${ASSISTANTS_URL}/${name}`;

export class AssistantsApi extends BaseApi {
  getAssistantsList(token: JWT | null): Promise<DialAssistant[] | null> {
    return this.get(ASSISTANTS_URL, token);
  }

  getAssistant(name: string, token: JWT | null): Promise<DialAssistant | null> {
    return this.get(ASSISTANT_URL(name), token);
  }

  removeAssistant(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(ASSISTANT_URL(name), token);
  }

  createAssistant(assistant: DialAssistant, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(ASSISTANTS_URL, assistant, token);
  }

  updateAssistant(assistant: DialAssistant, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(ASSISTANT_URL(assistant.name), assistant, token);
  }
}
