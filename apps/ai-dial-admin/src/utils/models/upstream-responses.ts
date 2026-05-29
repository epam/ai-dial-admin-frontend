import { DialModel } from '@/src/models/dial/model';

export const isDialModelEntity = (entity: unknown): entity is DialModel =>
  typeof entity === 'object' && entity !== null && 'type' in entity;

export const clearUpstreamResponsesEndpoints = (model: DialModel): DialModel => {
  if (!model.upstreams?.some((upstream) => upstream.responsesEndpoint)) {
    return model;
  }

  return {
    ...model,
    upstreams: model.upstreams.map((upstream) => ({ ...upstream, responsesEndpoint: undefined })),
  };
};
