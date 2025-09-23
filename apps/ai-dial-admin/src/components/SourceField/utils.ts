import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { getUrlError } from '@/src/utils/validation/url-error';
import { DialModel } from '@/src/models/dial/model';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { Toolset } from '@/src/models/dial/toolset';

export const isValidSourceField = (entity: DialModel | DialInterceptor | Toolset): boolean => {
  const source = entity.source;

  if (source?.$type === SOURCE_TYPE.CONTAINER) {
    return !!source.containerId;
  }
  if (source?.$type === SOURCE_TYPE.ADAPTER) {
    return !!source.adapterName && !!source.completionEndpointPath;
  }
  if (source?.$type === SOURCE_TYPE.RUNNER) {
    return !!source.runnerName;
  }
  if (source?.$type === SOURCE_TYPE.ENDPOINTS) {
    return getUrlError(entity.endpoint as string, void 0, true) === null;
  }
  return false;
};
