import { JWT } from 'next-auth/jwt';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { ServerActionResponse } from '@/src/models/server-action';

export const HUGGINGFACE_MODELS_BASE = `${API}/huggingface/models`;
export const HUGGINGFACE_MODELS_SEARCH = (search: string) =>
  search ? `${HUGGINGFACE_MODELS_BASE}?search=${search}` : `${HUGGINGFACE_MODELS_BASE}`;

export class HuggingfaceApi extends BaseApi {
  getHuggingFaceModels(search: string, token: JWT | null): Promise<ServerActionResponse> {
    return this.getAction(HUGGINGFACE_MODELS_SEARCH(search), token);
  }
}
