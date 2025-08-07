import { DialModel, DialModelEndpoint } from '@/src/models/dial/model';
import { isValidEndpoint } from '@/src/utils/validation/url-error';

export const isValidModel = (entity: DialModel) => {
  return !!entity.adapter && isValidUpstreams(entity.upstreams) && !!entity.endpointDeploymentName;
};

export const isValidUpstreams = (upstreams?: DialModelEndpoint[]): boolean => {
  if (upstreams) {
    return upstreams.every((upstream) => {
      if (upstream.endpoint === '' || !upstream.endpoint) {
        return true;
      }
      return isValidEndpoint(upstream.endpoint);
    });
  }
  return true;
};
