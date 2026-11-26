'use client';

import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant } from '@epam/ai-dial-ui-kit';

import { TryOutFailure, TryOutFailureKind } from '@/src/components/TryOut/Deployment/models';
import { DeploymentTryOutI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const FAILURE_MESSAGES: Record<TryOutFailureKind, DeploymentTryOutI18nKey> = {
  [TryOutFailureKind.NoAccess]: DeploymentTryOutI18nKey.NoAccess,
  [TryOutFailureKind.NotFound]: DeploymentTryOutI18nKey.NotFound,
  [TryOutFailureKind.Rejected]: DeploymentTryOutI18nKey.Rejected,
  [TryOutFailureKind.Server]: DeploymentTryOutI18nKey.ServerFailure,
  [TryOutFailureKind.Network]: DeploymentTryOutI18nKey.NetworkFailure,
};

interface Props {
  failure: TryOutFailure;
}

const TryOutFailureMessage: FC<Props> = ({ failure }) => {
  const t = useI18n();
  const message = t(FAILURE_MESSAGES[failure.kind]);

  return (
    <Notification
      type={NotificationType.SectionMessage}
      variant={NotificationVariant.Error}
      message={failure.status != null ? `${message} (${failure.status})` : message}
    />
  );
};

export default TryOutFailureMessage;
