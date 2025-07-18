import { DialModel, DialModelType } from '@/src/models/dial/model';

const deploymentsPrefix = '/deployments/';

export const splitEndpoint = (model: DialModel): [string, string] => {
  const postfix = model.type === DialModelType.Chat ? '/chat/completions' : '/embeddings';
  const endpoint = model.endpoint?.split(postfix)[0];
  const adapter = adapters.find((a) => `${endpoint}/`?.startsWith(a.baseEndpoint || ''));
  return [prefix, postfix];
};
