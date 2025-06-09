import { DialModel, DialModelType } from '@/src/models/dial/model';
import { DialAdapter } from '@/src/models/dial/adapter';

const CHAT = 'chat/completions';
const EMBEDDINGS = 'embeddings';

export const createEndpoint = (endpoint: string, model: DialModel): string => {
  return endpoint === '' ? endpoint : `${endpoint}${model.name}/${getEndpointByType(model)}`;
};

export const updateEndPoint = (model: DialModel, adapters: DialAdapter[]): string => {
  const endpoint = getModelAdapter(model, adapters)?.baseEndpoint || '';
  return createEndpoint(endpoint, model);
};

export const getModelAdapter = (model: DialModel, adapters: DialAdapter[]): DialAdapter | undefined => {
  return model.endpoint
    ? adapters.find((adapter) => model.endpoint?.startsWith(adapter.baseEndpoint as string))
    : void 0;
};

export const getFormatterAdapter = (model: DialModel, adapters: DialAdapter[]): string => {
  return getModelAdapter(model, adapters)?.name || model.endpoint || '';
};

const getEndpointByType = (model: DialModel): string =>
  model.type === DialModelType.Chat || !model.type ? CHAT : EMBEDDINGS;
