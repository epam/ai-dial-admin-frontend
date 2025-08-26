import { MAX_ATTACHMENTS_LIMIT } from '@/src/constants/dial-base-entity';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { DialModel, DialModelEndpoint } from '@/src/models/dial/model';
import { isValidEndpoint } from '@/src/utils/validation/url-error';

export const isValidModel = (entity: DialModel) => {
  return !!entity.adapter;
};

export const getMaxAttachmentError = (
  maxInputAttachments?: number | string,
  t?: (str: string, param?: Record<string, number>) => string,
) => {
  const isValid = !maxInputAttachments || +maxInputAttachments <= MAX_ATTACHMENTS_LIMIT;
  if (!isValid) {
    return t?.(ErrorI18nKey.MaxNumberError, { max: MAX_ATTACHMENTS_LIMIT });
  }

  return;
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
