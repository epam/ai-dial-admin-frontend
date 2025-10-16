import { FC, useCallback, useState } from 'react';
import { ButtonVariant, DialButton, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { AlertVariant, DialAlert } from '@epam/ai-dial-ui-kit';

import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, RollbackI18nKey } from '@/src/constants/i18n';
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
    (value?: string) => {
      setConfirmation(value || '');
      setIsDisabled(value !== t(RollbackI18nKey.System));
    },
    [t],
  );

  return (
    <Popup
      onClose={onClose}
      heading={t(RollbackI18nKey.ConfirmSystemRollbackTitle)}
      portalId="ConfirmationRollBackModal"
      state={modalState}
      dividers={true}
    >
      <div className="px-6 py-4">
        <div className="text-secondary small-150">
          {t(RollbackI18nKey.ConfirmSystemRollbackDescription)}
          <span className="important-text-part ml-2">{revisionDate}</span>
        </div>
        <div className="my-4">
          <DialAlert variant={AlertVariant.Error} message={t(RollbackI18nKey.ConfirmSystemRollbackAlert)} />
        </div>
        <DialTextInputField
          elementId="confirmationText"
          fieldTitle={t(RollbackI18nKey.ConfirmSystemRollbackLabel)}
          placeholder={t(RollbackI18nKey.ConfirmSystemRollbackPlaceholder)}
          value={confirmation}
          onChange={onChangeConfirmation}
        />
      </div>

      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          title={t(ButtonsI18nKey.Rollback)}
          onClick={onConfirm}
          disable={isDisabled}
        />
      </div>
    </Popup>
  );
};

export default ConfirmationRollback;
