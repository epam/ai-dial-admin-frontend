import { JWT } from 'next-auth/jwt';

import { DialModel } from '@/src/models/dial/model';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';

export const MODELS_URL = `${API}/models`;
export const MODELS_TOPICS = `${API}/topics`;
export const MODELS_TOKENIZERS = `${API}/tokenizers`;
export const MODEL_URL = (id?: string) => `${MODELS_URL}/${id || ''}`;

export class ModelsApi extends BaseApi {
  getModelsList(token: JWT | null): Promise<DialModel[] | null> {
    return this.get(MODELS_URL, token);
  }

  getModelsTopics(token: JWT | null): Promise<ServerActionResponse> {
    return this.getAction(MODELS_TOPICS, token);
  }

  getModelsTokenizers(token: JWT | null): Promise<ServerActionResponse> {
    return this.getAction(MODELS_TOKENIZERS, token);
  }

  createModel(model: DialModel, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(MODELS_URL, model, token);
  }

  removeModel(token: JWT | null, modelName?: string): Promise<ServerActionResponse> {
    return this.deleteAction(MODEL_URL(modelName), token);
  }

  getModel(name: string, token: JWT | null, eTag: string) {
    return this.getActionWithEtag(MODEL_URL(name), eTag || DEFAULT_ETAG, token);
  }

  updateModel(model: DialModel, token: JWT | null, eTag?: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(MODEL_URL(model.name), model, token, eTag);
  }
}
