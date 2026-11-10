'use client';

import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant, Tooltip } from '@epam/ai-dial-ui-kit';

import { CLIENT_SECRET_PLACEHOLDER } from '@/src/components/EntityListView/Import/constants';
import { ImportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  isOverride: boolean;
}

const ClientSecretWarning: FC<Props> = ({ isOverride }) => {
  const t = useI18n();

  const details = (
    <span className="dial-tiny-text flex flex-col gap-2">
      <span>{t(ImportI18nKey.ClientSecretWarning, { placeholder: CLIENT_SECRET_PLACEHOLDER })}</span>
      {isOverride && <span>{t(ImportI18nKey.ClientSecretOverrideWarning)}</span>}
    </span>
  );

  // The details open on hover, which a keyboard or touch user never triggers — the same text also sits in the
  // notification as screen-reader-only content, so assistive tech reads it with the title.
  return (
    <Tooltip tooltip={details} triggerClassName="block w-full" contentClassName="max-w-[420px]">
      <Notification
        type={NotificationType.SectionMessage}
        variant={NotificationVariant.Warning}
        title={t(ImportI18nKey.ClientSecretWarningTitle)}
        message={<span className="sr-only">{details}</span>}
      />
    </Tooltip>
  );
};

export default ClientSecretWarning;
