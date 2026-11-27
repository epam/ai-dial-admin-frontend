'use client';

import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant, OutlinedButton } from '@epam/ai-dial-ui-kit';

import {
  TryOutFailureKind,
  TryOutLookup,
  TryOutLookupStatus,
  TryOutUnavailableReason,
} from '@/src/components/TryOut/Deployment/models';
import { DeploymentTryOutI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const UNAVAILABLE_MESSAGES: Record<TryOutUnavailableReason, DeploymentTryOutI18nKey> = {
  [TryOutUnavailableReason.McpOnly]: DeploymentTryOutI18nKey.UnavailableMcpOnly,
  [TryOutUnavailableReason.CustomUiOnly]: DeploymentTryOutI18nKey.UnavailableCustomUiOnly,
  [TryOutUnavailableReason.NoInterface]: DeploymentTryOutI18nKey.UnavailableNoInterface,
};

const LOOKUP_FAILURE_MESSAGES: Record<TryOutFailureKind, DeploymentTryOutI18nKey> = {
  [TryOutFailureKind.NoAccess]: DeploymentTryOutI18nKey.NoAccess,
  [TryOutFailureKind.NotFound]: DeploymentTryOutI18nKey.NotFound,
  [TryOutFailureKind.Rejected]: DeploymentTryOutI18nKey.LookupFailed,
  [TryOutFailureKind.Server]: DeploymentTryOutI18nKey.LookupFailed,
  [TryOutFailureKind.Network]: DeploymentTryOutI18nKey.LookupFailed,
};

const RETRYABLE_FAILURES = [TryOutFailureKind.Server, TryOutFailureKind.Network];

interface Props {
  lookup: TryOutLookup;
  onRetry: () => void;
}

/** Says why the panel offers no form: the deployment serves nothing Try out can call, or it could not be read. */
const TryOutLookupMessage: FC<Props> = ({ lookup, onRetry }) => {
  const t = useI18n();

  if (lookup.status === TryOutLookupStatus.Unavailable && lookup.reason) {
    return <p role="status">{t(UNAVAILABLE_MESSAGES[lookup.reason])}</p>;
  }
  if (lookup.status !== TryOutLookupStatus.Failed || !lookup.failure) {
    return null;
  }
  const { kind, status } = lookup.failure;
  const message = t(LOOKUP_FAILURE_MESSAGES[kind]);

  return (
    <div className="flex flex-col gap-y-3 items-start">
      <Notification
        type={NotificationType.SectionMessage}
        variant={NotificationVariant.Error}
        message={status != null ? `${message} (${status})` : message}
      />
      {RETRYABLE_FAILURES.includes(kind) && (
        <OutlinedButton label={t(DeploymentTryOutI18nKey.Retry)} onClick={onRetry} />
      )}
    </div>
  );
};

export default TryOutLookupMessage;
