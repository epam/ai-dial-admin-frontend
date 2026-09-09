'use client';

import { FC, useCallback } from 'react';

import { ConfirmationPopupVariant, DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  run: Run;
  onClose: () => void;
  onCancelRun: (id: string) => Promise<ServerActionResponse>;
  /** Called after a successful cancel, once the confirmation is closed — refresh whatever this
   * surface needs (a single-entity refetch, a grid reload, a full page refresh, etc). */
  onSuccess?: () => void;
}

const RunCancelModal: FC<Props> = ({ run, onClose, onCancelRun, onSuccess }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const onConfirm = useCallback(async () => {
    if (!run.id) return;

    const res = await onCancelRun(run.id);
    onClose();

    if (res.success) {
      showNotification(
        getSuccessNotification(t(RunsI18nKey.CancelRunSuccess), t(RunsI18nKey.CancelRunSuccessDescription)),
      );
      onSuccess?.();
    } else {
      showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
    }
  }, [run.id, onClose, onCancelRun, onSuccess, showNotification, t]);

  return (
    <DialConfirmationPopup
      portalId="RunCancelModal"
      onClose={onClose}
      header={t(RunsI18nKey.CancelRunModalTitle)}
      variant={ConfirmationPopupVariant.Danger}
      open={true}
      confirmLabel={t(ButtonsI18nKey.Stop)}
      onConfirm={onConfirm}
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4 gap-2">
        <span className="text-secondary dial-small">{t(RunsI18nKey.CancelRunModalDescription)}</span>
      </div>
    </DialConfirmationPopup>
  );
};

export default RunCancelModal;
