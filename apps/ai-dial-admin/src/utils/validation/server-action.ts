import { ErrorI18nKey } from '@/src/constants/i18n';
import { Translate } from '@/src/models/error';
import { ServerActionResponse } from '@/src/models/server-action';

export const validationFailure = (errors: Record<string, string | undefined>, t: Translate): ServerActionResponse => ({
  success: false,
  errorHeader: t(ErrorI18nKey.ValidationError),
  errorMessage: Object.values(errors).filter(Boolean).join(', '),
});
