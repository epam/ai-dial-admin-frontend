import { DialModelType } from '@/src/models/dial/model';

export const getEndpointPostfix = (type?: DialModelType) => {
  return type === DialModelType.Chat ? '/chat/completions' : '/embeddings';
};
