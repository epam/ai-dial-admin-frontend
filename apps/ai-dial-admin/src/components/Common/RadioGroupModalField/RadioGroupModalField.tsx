import { FC, useCallback, useState } from 'react';

import classNames from 'classnames';
import { RadioButtonWithContent } from '@epam/ai-dial-ui-kit';

import Field from '@/src/components/Common/Field/Field';
import InputModal from '@/src/components/Common/InputModal/InputModal';
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
  inputCssClasses?: string;
  isValid: boolean;
  disabled?: boolean;
  radioButtons: RadioButtonWithContent[];
  onChangeRadioField: (id: string) => void;
  onApply: () => void;
  onClose?: () => void;
}

const RadioGroupModalField: FC<Props> = ({
  title,
  popupTitle,
  elementId,
  disabled,
  customInputValue,
  selectedInputValue,
  selectedRadioValue,
  valueCssClasses,
  radioButtons,
  onApply,
  onClose,
  inputCssClasses,
  ...props
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
        readonly={disabled}
        modalState={modalState}
        selectedValue={customInputValue ?? radioButtons.find(({ id }) => id === selectedInputValue)?.name}
        valueCssClasses={valueCssClasses}
        inputCssClasses={classNames(inputCssClasses, 'py-2 px-3')}
        onOpenModal={onOpenModal}
      >
        <RadioGroupModal
          title={popupTitle ?? title}
          modalState={modalState}
          elementId={elementId}
          selectedValue={selectedRadioValue}
          radioButtons={radioButtons}
          onApply={onApplyModal}
          onClose={onCloseModal}
          {...props}
        />
      </InputModal>
    </div>
  );
};

export default RadioGroupModalField;
