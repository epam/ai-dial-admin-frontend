import { ErrorText, Label } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import classNames from 'classnames';

import InputPopup from '@/src/components/Common/InputPopup/InputPopup';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { GetItemError } from '@/src/models/error';
import { ServerActionResponse } from '@/src/models/server-action';
import MultiselectModal from './Modal/MultiselectModal';

interface Props {
  elementId: string;
  label: string;
  disabled?: boolean;
  required?: boolean;
  selectedItems?: string[];
  heading?: string;
  addTitle?: string;
  addPlaceholder?: string;
  allItems?: string[];
  draggable?: boolean;
  errorText?: string;
  className?: string;
  getItemError?: GetItemError;
  onChangeItems?: (items: string[]) => void;
  getItems?: () => Promise<ServerActionResponse>;
}

const Multiselect: FC<Props> = ({
  onChangeItems,
  elementId,
  selectedItems,
  label,
  disabled,
  required,
  errorText,
  className,
  ...props
}) => {
  const t = useI18n();
  const [isModalOpen, setIsModalState] = useState(false);

  const onOpenModal = useCallback(() => {
    setIsModalState(true);
  }, [setIsModalState]);

  const onCloseModal = useCallback(() => {
    setIsModalState(false);
  }, [setIsModalState]);

  return (
    <div className={classNames('flex flex-col gap-y-2', className)}>
      <Label label={label} htmlFor={elementId} required={required} />
      <InputPopup
        invalid={!!errorText}
        open={isModalOpen}
        disabled={disabled}
        selectedValue={selectedItems}
        onOpen={onOpenModal}
        emptyValueText={t(BasicI18nKey.None)}
        collapseTagOverflow
      >
        <MultiselectModal
          initSelectedItems={selectedItems}
          onSelectItems={onChangeItems}
          isModalOpen={isModalOpen}
          onClose={onCloseModal}
          {...props}
        />
      </InputPopup>
      {!disabled && <ErrorText text={errorText} />}
    </div>
  );
};

export default Multiselect;
