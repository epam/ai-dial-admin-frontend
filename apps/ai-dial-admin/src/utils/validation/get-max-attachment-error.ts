import { MAX_ATTACHMENTS_LIMIT } from '@/src/constants/dial-base-entity';
import { ErrorI18nKey } from '@/src/constants/i18n';

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
