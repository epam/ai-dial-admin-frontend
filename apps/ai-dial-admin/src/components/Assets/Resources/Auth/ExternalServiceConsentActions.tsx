'use client';

import { FC, useCallback, useMemo, useRef, useState } from 'react';

import { DialLoader, DialNeutralButton, DialTag } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';

import { ExternalServiceI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialExternalService } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import ExternalServiceConsentDialog from './ExternalServiceConsentDialog';
import { isExternalServiceApproved } from './external-service-auth-utils';

const NOT_FOUND_STATUS = 404;

interface Props {
  appPath: string;
  applicationName: string;
  serviceId: string;
  service: DialExternalService;
  grantConsent: (appPath: string, serviceId: string) => Promise<ServerActionResponse>;
  withdrawConsent: (appPath: string, serviceId: string) => Promise<ServerActionResponse>;
}

const ExternalServiceConsentActions: FC<Props> = ({
  appPath,
  applicationName,
  serviceId,
  service,
  grantConsent,
  withdrawConsent,
}) => {
  const t = useI18n();
  const router = useRouter();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isApproved = useMemo(() => isExternalServiceApproved(service), [service]);

  const onConfirm = useCallback(() => {
    setIsLoading(true);
    const action = isApproved ? withdrawConsent : grantConsent;

    getReqRef.current(action, appPath, serviceId).then((res: ServerActionResponse) => {
      setIsLoading(false);
      setIsDialogOpen(false);

      if (res.success) {
        showNotification(
          getSuccessNotification(
            t(isApproved ? ExternalServiceI18nKey.SuccessWithdrawConsent : ExternalServiceI18nKey.SuccessGrantConsent),
            t(
              isApproved
                ? ExternalServiceI18nKey.SuccessWithdrawConsentDescription
                : ExternalServiceI18nKey.SuccessGrantConsentDescription,
            ),
          ),
        );
        router.refresh();
        return;
      }

      showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      if (res.status === NOT_FOUND_STATUS) {
        router.refresh();
      }
    });
  }, [appPath, grantConsent, isApproved, router, serviceId, showNotification, t, withdrawConsent]);

  return (
    <>
      {isApproved && (
        <DialTag
          label={t(ExternalServiceI18nKey.Approved)}
          className="text-accent-secondary rounded-full bg-accent-secondary-alpha border border-transparent h-4 dial-caption-text shrink-0"
        />
      )}
      {isLoading ? (
        <DialLoader fullWidth={false} size={16} />
      ) : (
        !isReadOnlyAdmin && (
          <DialNeutralButton
            label={t(isApproved ? ExternalServiceI18nKey.WithdrawConsent : ExternalServiceI18nKey.GrantConsent)}
            onClick={() => setIsDialogOpen(true)}
          />
        )
      )}
      {isDialogOpen && (
        <ExternalServiceConsentDialog
          applicationName={applicationName}
          isApproved={isApproved}
          isLoading={isLoading}
          onConfirm={onConfirm}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </>
  );
};

export default ExternalServiceConsentActions;
