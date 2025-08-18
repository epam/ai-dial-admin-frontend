import { DialModel, DialModelType } from '@/src/models/dial/model';
import { DialAdapter } from '@/src/models/dial/adapter';

export const splitEndpoint = (model: DialModel, adapters: DialAdapter[]): [string, string] => {
  const postfix = model.type === DialModelType.Chat ? 'chat/completions' : 'embeddings';
  const endpoint = model.endpoint?.split(postfix)[0];
  const adapter = adapters.find((a) => `${endpoint}/`?.startsWith(a.baseEndpoint || ''));

  return [adapter?.baseEndpoint || '', postfix];
};
