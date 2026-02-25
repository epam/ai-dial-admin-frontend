import { FC, useCallback, useState } from 'react';
import { DialErrorText, DialInputPopup } from '@epam/ai-dial-ui-kit';

import Field from '@/src/components/Common/Field/Field';
import { ServerActionResponse } from '@/src/models/server-action';
import MultiselectModal from './Modal/MultiselectModal';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import classNames from 'classnames';

interface Props {
  elementId: string;
  label: string;
  disabled?: boolean;
  optional?: boolean;
  selectedItems?: string[];
  heading?: string;
  addTitle?: string;
  addPlaceholder?: string;
  allItems?: string[];
  draggable?: boolean;
  errorText?: string;
  className?: string;
  onChangeItems?: (items: string[]) => void;
  getItems?: () => Promise<ServerActionResponse>;
}

const Multiselect: FC<Props> = ({
  onChangeItems,
  elementId,
  selectedItems,
  label,
  disabled,
  optional,
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
    <div className={classNames('flex flex-col', className)}>
      <Field fieldTitle={label} htmlFor={elementId} optional={optional} />
      <DialInputPopup
        inputClassName={errorText && 'dial-input-error'}
        open={isModalOpen}
        disabled={disabled}
        selectedValue={selectedItems}
        onOpen={onOpenModal}
        emptyValueText={t(BasicI18nKey.None)}
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
