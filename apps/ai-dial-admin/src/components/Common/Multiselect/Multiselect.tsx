import { FC, useCallback, useState } from 'react';

import ErrorText from '@/src/components/Common/ErrorText/ErrorText';
import Field from '@/src/components/Common/Field/Field';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import { ServerActionResponse } from '@/src/models/server-action';
import { PopUpState } from '@/src/types/pop-up';
import MultiselectModal from './Modal/MultiselectModal';

interface Props {
  elementId: string;
  title: string;
  readonly?: boolean;
  optional?: boolean;
  selectedItems?: string[];
  heading?: string;
  addTitle?: string;
  addPlaceholder?: string;
  allItems?: string[];
  draggable?: boolean;
  errorText?: string;
  onChangeItems?: (items: string[]) => void;
  getItems?: () => Promise<ServerActionResponse>;
}

const Multiselect: FC<Props> = ({
  onChangeItems,
  elementId,
  selectedItems,
  title,
  readonly,
  optional,
  errorText,
  ...props
}) => {
  const [modalState, setIsModalState] = useState(PopUpState.Closed);

  const onOpenModal = useCallback(() => {
    setIsModalState(PopUpState.Opened);
  }, [setIsModalState]);

  const onCloseModal = useCallback(() => {
    setIsModalState(PopUpState.Closed);
  }, [setIsModalState]);

  return (
    <div className="flex flex-col">
      <Field fieldTitle={title} htmlFor={elementId} optional={optional} />
      <InputModal
        inputCssClasses={errorText ? 'dial-input-error' : ''}
        modalState={modalState}
        readonly={readonly}
        selectedValue={selectedItems}
        onOpenModal={onOpenModal}
      >
        <MultiselectModal
          initSelectedItems={selectedItems}
          onSelectItems={onChangeItems}
          isModalOpen={modalState}
          onClose={onCloseModal}
          {...props}
        />
      </InputModal>
      <ErrorText errorText={errorText} />
    </div>
  );
};

export default Multiselect;
