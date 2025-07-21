import { FC, useCallback, useState } from 'react';

import Field from '@/src/components/Common/Field/Field';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import { PopUpState } from '@/src/types/pop-up';
import { ServerActionResponse } from '@/src/models/server-action';
import MultiselectModal from './Modal/MultiselectModal';

interface Props {
  elementId: string;
  title: string;
  readonly?: boolean;
  selectedItems?: string[];
  heading?: string;
  addTitle?: string;
  addPlaceholder?: string;
  allItems?: string[];
  draggable?: boolean;
  editMode?: boolean;
  onChangeItems?: (items: string[]) => void;
  getItems?: () => Promise<ServerActionResponse>;
}

const Multiselect: FC<Props> = ({ onChangeItems, elementId, selectedItems, title, readonly, ...props }) => {
  const [modalState, setIsModalState] = useState(PopUpState.Closed);

  const onOpenModal = useCallback(() => {
    setIsModalState(PopUpState.Opened);
  }, [setIsModalState]);

  const onCloseModal = useCallback(() => {
    setIsModalState(PopUpState.Closed);
  }, [setIsModalState]);

  return (
    <div className="flex flex-col">
      <Field fieldTitle={title} htmlFor={elementId} />
      <InputModal modalState={modalState} readonly={readonly} selectedValue={selectedItems} onOpenModal={onOpenModal}>
        <MultiselectModal
          initSelectedItems={selectedItems}
          onSelectItems={onChangeItems}
          modalState={modalState}
          onClose={onCloseModal}
          {...props}
        />
      </InputModal>
    </div>
  );
};

export default Multiselect;
