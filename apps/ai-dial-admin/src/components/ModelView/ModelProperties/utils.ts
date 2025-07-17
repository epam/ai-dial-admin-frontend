import { DialModel, DialModelType } from '@/src/models/dial/model';

const deploymentsPrefix = '/deployments/';

export const splitEndpoint = (model: DialModel): [string, string, string] => {
  const postfix = model.type === DialModelType.Chat ? '/chat/completions' : '/embeddings';
  const prefix = `${model.endpoint?.split(deploymentsPrefix)[0] || ''}${deploymentsPrefix}`;
  const endpoint = model.endpoint?.replace(postfix, '').replace(prefix, '') || '';

  return [prefix, endpoint, postfix];
};
