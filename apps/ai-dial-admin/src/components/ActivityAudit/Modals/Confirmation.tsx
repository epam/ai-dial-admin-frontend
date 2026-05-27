import { NotificationVariant, DialNotification, DialConfirmationPopup, DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import { ButtonsI18nKey, RollbackI18nKey } from '@/src/constants/i18n';
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
      setIsDisabled(value !== t(RollbackI18nKey.Rollback));
    },
    [t],
  );

  return (
    <DialConfirmationPopup
      onClose={onClose}
      header={t(RollbackI18nKey.ConfirmSystemRollbackTitle)}
      portalId="ConfirmationRollBackModal"
      open={isModalOpen}
      disableConfirmButton={isDisabled}
      dividers={true}
      onConfirm={onConfirm}
      confirmLabel={t(ButtonsI18nKey.Rollback)}
    >
      <div className="px-6 py-4">
        <div className="text-secondary small-150">
          {t(RollbackI18nKey.ConfirmSystemRollbackDescription)}
          <span className="important-text-part ml-2">{revisionDate}</span>
        </div>
        <div className="my-4">
          <DialNotification
            variant={NotificationVariant.Error}
            message={t(RollbackI18nKey.ConfirmSystemRollbackAlert)}
          />
        </div>
        <DialInput
          id="confirmationText"
          labelProps={{ label: t(RollbackI18nKey.ConfirmSystemRollbackLabel), required: true }}
          placeholder={t(RollbackI18nKey.ConfirmSystemRollbackPlaceholder)}
          value={confirmation}
          onChange={onChangeConfirmation}
        />
      </div>
    </DialConfirmationPopup>
  );
};

export default ConfirmationRollback;
