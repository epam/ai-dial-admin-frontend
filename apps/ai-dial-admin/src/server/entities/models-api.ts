import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Token } from '@/src/models/auth';
import { DialModel, DialTokenizer } from '@/src/models/dial/model';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const MODELS_URL = `${API}/models`;
export const MODELS_TOPICS = `${API}/topics`;
export const MODELS_TOKENIZERS = `${API}/tokenizers`;
export const MODEL_URL = (id?: string) => `${MODELS_URL}/${id || ''}`;
export const CORE_MODEL_URL = (id: string) => `${MODELS_URL}/core/${id}`;

export class ModelsApi extends BaseApi {
  getModelsList(token: Token | undefined): Promise<DialModel[] | null> {
    return this.get(MODELS_URL, token);
  }

  getModelsListAction(token: Token | undefined): Promise<ServerActionResponse<DialModel[]>> {
    return this.getAction(MODELS_URL, token);
  }

  getModelsTopics(token: Token | undefined): Promise<ServerActionResponse> {
    return this.getAction(MODELS_TOPICS, token);
  }

  getModelsTokenizers(token: Token | undefined): Promise<ServerActionResponse<DialTokenizer[]>> {
    return this.getAction(MODELS_TOKENIZERS, token);
  }

  createModel(model: DialModel, token: Token | undefined): Promise<ServerActionResponse> {
    return this.postAction(MODELS_URL, model, token);
  }

  removeModel(token: Token | undefined, modelName?: string): Promise<ServerActionResponse> {
    return this.deleteAction(MODEL_URL(modelName), token);
  }

  getModel(name: string, token: Token | undefined, eTag: string) {
    return this.getActionWithEtag(MODEL_URL(name), eTag, token);
  }

  updateModel(model: DialModel, token: Token | undefined, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(MODEL_URL(encodeURIComponent(model.name || '')), model, token, eTag);
  }

  getCoreModel(name: string, token: Token | undefined) {
    return this.getActionWithEtag(CORE_MODEL_URL(name), DEFAULT_ETAG, token);
  }

  updateCoreModel(
    model: DialModel,
    name: string,
    eTag: string,
    token: Token | undefined,
  ): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_MODEL_URL(encodeURIComponent(name)), model, token, eTag);
  }
}
