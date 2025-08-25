import { DialModel, DialModelEndpoint } from '@/src/models/dial/model';
import { isValidEndpoint } from '@/src/utils/validation/url-error';
import { MAX_ATTACHMENTS_LIMIT } from '@/src/constants/dial-base-entity';

export const isValidModel = (entity: DialModel) => {
  return !!entity.adapter && isValidAttachment(entity.maxInputAttachments);
};

export const isValidAttachment = (maxInputAttachments?: string | number): boolean => {
  if (maxInputAttachments) {
    return +maxInputAttachments <= MAX_ATTACHMENTS_LIMIT;
  }
  return true;
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
