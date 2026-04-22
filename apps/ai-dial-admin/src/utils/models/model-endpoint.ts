import { DialModelType } from '@/src/models/dial/model';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';

export const getEndpointPostfix = (type?: DialModelType) => {
  return type === DialModelType.Chat ? '/chat/completions' : '/embeddings';
};

export const getEndpointPrefix = (containerType?: CONTAINER_TYPE) => {
  return containerType === CONTAINER_TYPE.NIM ? 'v1' : 'openai/v1';
};
