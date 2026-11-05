import { CustomDashboardsI18nKey } from '@/src/constants/i18n';
import { Notification } from '@/src/models/notification';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';

const CONFLICT_STATUS = 409;

export const getDashboardWriteErrorNotification = (
  res: ServerActionResponse,
  t: (key: string) => string,
): Notification =>
  res.status === CONFLICT_STATUS
    ? getErrorNotification(
        t(CustomDashboardsI18nKey.ChangedElsewhere),
        t(CustomDashboardsI18nKey.ChangedElsewhereHint),
        res.requestId,
      )
    : getErrorNotification(res.errorHeader, res.errorMessage, res.requestId);
