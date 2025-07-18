import { DialModel, DialModelType } from '@/src/models/dial/model';

const deploymentsPrefix = '/deployments/';

export const splitEndpoint = (model: DialModel): [string, string] => {
  const postfix = model.type === DialModelType.Chat ? '/chat/completions' : '/embeddings';
  const prefix = `${model.endpoint?.split(deploymentsPrefix)[0] || ''}${deploymentsPrefix}`;

  return [prefix, postfix];
};
