import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialModel } from '@/src/models/dial/model';

const isAdapterResponsesLoading = (model: DialModel, selectedAdapter: DialAdapter | null): boolean =>
  model.source?.$type === SOURCE_TYPE.ADAPTER && !!model.source?.adapterName && selectedAdapter === null;

export const shouldClearUpstreamResponsesEndpoints = (
  model: DialModel,
  showResponsesDefaults: boolean,
  selectedAdapter: DialAdapter | null,
): boolean =>
  !showResponsesDefaults &&
  !isAdapterResponsesLoading(model, selectedAdapter) &&
  !!model.upstreams?.some((upstream) => upstream.responsesEndpoint);

export const clearUpstreamResponsesEndpoints = (model: DialModel): DialModel => {
  if (!model.upstreams?.some((upstream) => upstream.responsesEndpoint)) {
    return model;
  }

  return {
    ...model,
    upstreams: model.upstreams.map((upstream) => ({ ...upstream, responsesEndpoint: undefined })),
  };
};
