import { FC } from 'react';
import {
  ButtonVariant,
  RadioButtonWithContent,
  DialButton,
  DialRadioGroup,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';

import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  portalId: string;
  title: string;
  selectedValue: string;
  elementId: string;
  modalState: PopUpState;
  radioButtons: RadioButtonWithContent[];
  isValid: boolean;
  onChangeRadioField: (id: string) => void;
  onApply: () => void;
  onClose: () => void;
}

const RadioGroupModal: FC<Props> = ({
  modalState,
  title,
  elementId,
  portalId,
  selectedValue,
  isValid,
  radioButtons,
  onApply,
  onClose,
  onChangeRadioField,
}) => {
  const t = useI18n();
  return (
    <Popup onClose={onClose} heading={title} portalId={portalId} state={modalState}>
      <div className="px-6 py-4">
        <DialRadioGroup
          radioButtons={radioButtons}
          activeRadioButton={selectedValue}
          labelCssClass="small"
          elementId={elementId}
          orientation={RadioGroupOrientation.Column}
          onChange={onChangeRadioField}
        />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          title={t(ButtonsI18nKey.Apply)}
          onClick={onApply}
          disable={!isValid}
        />
      </div>
    </Popup>
  );
};

export default RadioGroupModal;
