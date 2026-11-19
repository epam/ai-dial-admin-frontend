import { FC } from 'react';
import {
  Button,
  ButtonAppearance,
  ButtonVariant,
  ElementSize,
  Notification as KitNotification,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';

import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { NotificationConfig, NotificationType } from '@/src/models/notification';

const VARIANTS: Record<NotificationType, NotificationVariant> = {
  [NotificationType.success]: NotificationVariant.Success,
  [NotificationType.error]: NotificationVariant.Error,
  [NotificationType.prepare]: NotificationVariant.Loading,
};

const Notification: FC<NotificationConfig> = ({ type, title, description, requestId, action, onClose }) => {
  const t = useI18n();
  const hasBody = !!description || !!requestId || !!action;

  const onAction = () => {
    action?.onClick();
    onClose?.();
  };

  const actionButton = action ? (
    <Button
      variant={ButtonVariant.Neutral}
      appearance={ButtonAppearance.Outlined}
      size={ElementSize.Small}
      textClassName="text-primary"
      label={action.label}
      onClick={onAction}
    />
  ) : null;

  const body = hasBody ? (
    <div className="flex flex-col items-start gap-4">
      {description || requestId ? (
        <div className="flex flex-col gap-1 min-w-0 max-w-full max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
          {description ? <span>{description}</span> : null}
          {requestId ? <span className="text-secondary">{t(BasicI18nKey.RequestId, { id: requestId })}</span> : null}
        </div>
      ) : null}
      {actionButton}
    </div>
  ) : (
    title
  );

  return (
    <KitNotification
      className="w-[440px] max-w-full"
      variant={VARIANTS[type]}
      title={hasBody && title ? title : void 0}
      message={body}
      closable
      closeAriaLabel={t(ButtonsI18nKey.Close)}
      onClose={onClose}
    />
  );
};

export default Notification;
