'use client';

import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant } from '@epam/ai-dial-ui-kit';

import { CustomDashboardsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/**
 * Says before the add what publishing's confirmation says before a publish: a personal query lands on a
 * public dashboard as a copy, so its text is shown to every viewer and later edits to it do not follow.
 */
const PersonalQueryCopyBanner: FC = () => {
  const t = useI18n();

  return (
    <Notification
      type={NotificationType.SectionMessage}
      variant={NotificationVariant.Warning}
      message={<span className="dial-small-text">{t(CustomDashboardsI18nKey.PersonalQueryCopied)}</span>}
    />
  );
};

export default PersonalQueryCopyBanner;
