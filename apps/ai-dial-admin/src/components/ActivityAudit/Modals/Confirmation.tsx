import { FC, useCallback, useState } from 'react';

import AlertError from '@/src/components/Common/Alerts/AlertError';
import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Popup from '@/src/components/Common/Popup/Popup';
import { ActivityAuditI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  revisionDate: string;
  modalState: PopUpState;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmationRollback: FC<Props> = ({ revisionDate, modalState, onClose, onConfirm }) => {
  const t = useI18n();
  const [confirmation, setConfirmation] = useState('');
  const [isDisabled, setIsDisabled] = useState(true);

  const onChangeConfirmation = useCallback(
    (value: string) => {
      setConfirmation(value);
      setIsDisabled(value !== t(ActivityAuditI18nKey.RollbackSystem));
    },
    [t],
  );

  return (
    <Popup
      onClose={onClose}
      heading={t(ActivityAuditI18nKey.ConfirmSystemRollback)}
      portalId="ConfirmationRollBackModal"
      state={modalState}
      dividers={true}
    >
      <div className="px-6 py-4">
        <div className="text-secondary small-150">
          {t(ActivityAuditI18nKey.ConfirmSystemRollbackDescription)}
          <span className="important-text-part ml-2">{revisionDate}</span>
        </div>
        <div className="my-4">
          <AlertError text={t(ActivityAuditI18nKey.ConfirmSystemRollbackAlert)} />
        </div>
        <TextInputField
          elementId="confirmationText"
          fieldTitle={t(ActivityAuditI18nKey.ConfirmSystemRollbackLabel)}
          placeholder={t(ActivityAuditI18nKey.ConfirmSystemRollbackPlaceholder)}
          value={confirmation}
          onChange={onChangeConfirmation}
        />
      </div>

      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button cssClass="primary" title={t(ButtonsI18nKey.Rollback)} onClick={onConfirm} disable={isDisabled} />
      </div>
    </Popup>
  );
};

export default ConfirmationRollback;
