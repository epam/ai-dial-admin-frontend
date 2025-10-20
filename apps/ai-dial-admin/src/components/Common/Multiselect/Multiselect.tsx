import { FC, useCallback, useState } from 'react';

import Field from '@/src/components/Common/Field/Field';
import { ServerActionResponse } from '@/src/models/server-action';
import MultiselectModal from './Modal/MultiselectModal';
import { DialErrorText, DialInputPopup } from '@epam/ai-dial-ui-kit';

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
  const [isModalOpen, setIsModalState] = useState(false);

  const onOpenModal = useCallback(() => {
    setIsModalState(true);
  }, [setIsModalState]);

  const onCloseModal = useCallback(() => {
    setIsModalState(false);
  }, [setIsModalState]);

  return (
    <div className="flex flex-col">
      <Field fieldTitle={title} htmlFor={elementId} optional={optional} />
      <DialInputPopup
        inputCssClasses={errorText ? 'dial-input-error' : ''}
        open={isModalOpen}
        disabled={readonly}
        selectedValue={selectedItems}
        onOpen={onOpenModal}
      >
        <MultiselectModal
          initSelectedItems={selectedItems}
          onSelectItems={onChangeItems}
          isModalOpen={isModalOpen}
          onClose={onCloseModal}
          {...props}
        />
      </DialInputPopup>
      <DialErrorText errorText={errorText} />
    </div>
  );
};

export default Multiselect;
