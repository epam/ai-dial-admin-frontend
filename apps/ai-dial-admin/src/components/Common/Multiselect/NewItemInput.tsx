import classNames from 'classnames';
import { FC } from 'react';
import { IconTrash } from '@tabler/icons-react';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import Input from '@/src/components/Common/Input/Input';

interface Props {
  value: string;
  index: number;
  placeholder?: string;
  onChangeItem: (item: string, index: number) => void;
  onRemoveItem: (index: number) => void;
}

const NewItemInput: FC<Props> = ({ onRemoveItem, onChangeItem, index, value, placeholder }) => {
  return (
    <div className="flex flex-row gap-x-2 items-center">
      <Input
        inputId={'item ' + index}
        value={value}
        placeholder={placeholder}
        onChange={(v) => onChangeItem(v, index)}
      />

      <div
        className={classNames('cursor-pointer', !value ? 'text-secondary' : 'text-error')}
        onClick={() => onRemoveItem(index)}
      >
        <IconTrash {...BASE_ICON_PROPS} />
      </div>
    </div>
  );
};

export default NewItemInput;
