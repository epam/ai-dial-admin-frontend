import { FC, useCallback, useState } from 'react';
import { DialConfirmationPopup, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { AlertVariant, DialAlert } from '@epam/ai-dial-ui-kit';

import { ActivityAuditI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  revisionDate: string;
  isModalOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmationRollback: FC<Props> = ({ revisionDate, isModalOpen, onClose, onConfirm }) => {
  const t = useI18n();
  const [confirmation, setConfirmation] = useState('');
  const [isDisabled, setIsDisabled] = useState(true);

  const onChangeConfirmation = useCallback(
    (value?: string) => {
      setConfirmation(value || '');
      setIsDisabled(value !== t(ActivityAuditI18nKey.RollbackSystem));
    },
    [t],
  );

  return (
    <DialConfirmationPopup
      onClose={onClose}
      title={t(ActivityAuditI18nKey.ConfirmSystemRollback)}
      portalId="ConfirmationRollBackModal"
      open={isModalOpen}
      disableConfirmButton={isDisabled}
      dividers={true}
      onConfirm={onConfirm}
    >
      <div className="px-6 py-4">
        <div className="text-secondary small-150">
          {t(ActivityAuditI18nKey.ConfirmSystemRollbackDescription)}
          <span className="important-text-part ml-2">{revisionDate}</span>
        </div>
        <div className="my-4">
          <DialAlert variant={AlertVariant.Error} message={t(ActivityAuditI18nKey.ConfirmSystemRollbackAlert)} />
        </div>
        <DialTextInputField
          elementId="confirmationText"
          fieldTitle={t(ActivityAuditI18nKey.ConfirmSystemRollbackLabel)}
          placeholder={t(ActivityAuditI18nKey.ConfirmSystemRollbackPlaceholder)}
          value={confirmation}
          onChange={onChangeConfirmation}
        />
      </div>
    </DialConfirmationPopup>
  );
};

export default ConfirmationRollback;
