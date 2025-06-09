import { FC, useCallback, useState } from 'react';

import Field from '@/src/components/Common/Field/Field';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import { RadioButtonWithContent } from '@/src/components/Common/RadioGroup/RadioGroup';
import { PopUpState } from '@/src/types/pop-up';
import RadioGroupModal from './RadioGroupModal';

interface Props {
  title: string;
  popupTitle?: string;
  elementId: string;
  portalId: string;
  selectedInputValue?: string;
  customInputValue?: string;
  selectedRadioValue: string;
  valueCssClasses?: string;
  isValid: boolean;
  radioButtons: RadioButtonWithContent[];
  onChangeRadioField: (id: string) => void;
  onApply: () => void;
  onClose?: () => void;
}

const RadioGroupModalField: FC<Props> = ({
  title,
  popupTitle,
  elementId,
  portalId,
  customInputValue,
  selectedInputValue,
  selectedRadioValue,
  valueCssClasses,
  isValid,
  radioButtons,
  onChangeRadioField,
  onApply,
  onClose,
}) => {
  const [modalState, setIsModalState] = useState(PopUpState.Closed);
  const onOpenModal = useCallback(() => {
    setIsModalState(PopUpState.Opened);
  }, [setIsModalState]);
  const onCloseModal = useCallback(() => {
    setIsModalState(PopUpState.Closed);
    onClose?.();
  }, [setIsModalState, onClose]);
  const onApplyModal = useCallback(() => {
    onApply();
    onCloseModal();
  }, [onApply, onCloseModal]);

  return (
    <div className="flex flex-col">
      <Field fieldTitle={title} htmlFor={elementId} />
      <InputModal
        modalState={modalState}
        selectedValue={customInputValue ?? radioButtons.find(({ id }) => id === selectedInputValue)?.name}
        valueCssClasses={valueCssClasses}
        inputCssClasses="py-2 px-3"
        onOpenModal={onOpenModal}
      >
        <RadioGroupModal
          title={popupTitle ?? title}
          modalState={modalState}
          elementId={elementId}
          portalId={portalId}
          selectedValue={selectedRadioValue}
          isValid={isValid}
          radioButtons={radioButtons}
          onApply={onApplyModal}
          onClose={onCloseModal}
          onChangeRadioField={onChangeRadioField}
        />
      </InputModal>
    </div>
  );
};

export default RadioGroupModalField;
