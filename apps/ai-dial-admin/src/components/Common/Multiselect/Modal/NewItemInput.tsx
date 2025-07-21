import { IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import Input from '@/src/components/Common/Input/Input';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import DraggableItem from '@/src/components/Common/DraggableItem/DraggableItem';

interface Props {
  value: string;
  index: number;
  draggable?: boolean;
  placeholder?: string;
  onChangeItem: (item: string, index: number) => void;
  onRemoveItem: (index: number) => void;
  onMoveItem?: (field: string, index: number) => void;
  onFindItem?: (field: string) => number;
}

const NewItemInput: FC<Props> = ({
  onRemoveItem,
  onChangeItem,
  draggable,
  onFindItem,
  onMoveItem,
  index,
  value,
  placeholder,
}) => {
  const getItemContent = () => {
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

  return draggable ? (
    <DraggableItem id={index.toString()} findItem={onFindItem} moveItem={onMoveItem}>
      {getItemContent()}
    </DraggableItem>
  ) : (
    getItemContent()
  );
};

export default NewItemInput;
