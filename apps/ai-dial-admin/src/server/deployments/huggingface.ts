import { JWT } from 'next-auth/jwt';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { ServerActionResponse } from '@/src/models/server-action';

export const HUGGINGFACE_MODELS_BASE = `${API}/huggingface/models`;
export const HUGGINGFACE_MODELS = (params: Record<string, string>) => {
  const queryString = new URLSearchParams(params).toString();

  return `${HUGGINGFACE_MODELS_BASE}?${queryString}`;
};

export const HUGGINGFACE_MODEL_DETAILS = (modelName: string, sha: string) =>
  `${HUGGINGFACE_MODELS_BASE}/${modelName}/resolve/${sha}/README.md`;

export class HuggingfaceApi extends BaseApi {
  getHuggingFaceModels(params: Record<string, string>, token: JWT | null): Promise<ServerActionResponse> {
    return this.getAction(HUGGINGFACE_MODELS(params), token);
  }

  getModelDetails(modelName: string, sha: string, token: JWT | null): Promise<ServerActionResponse> {
    return this.getAction(HUGGINGFACE_MODEL_DETAILS(modelName, sha), token);
  }
}
