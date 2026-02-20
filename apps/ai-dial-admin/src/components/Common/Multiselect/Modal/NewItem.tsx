import { FC } from 'react';

import DraggableItem from '@/src/components/Common/DraggableItem/DraggableItem';
import NewItemInput from '@/src/components/Common/Multiselect/Modal/NewItemInput';

interface Props {
  value: string;
  index: number;
  draggable?: boolean;
  placeholder?: string;
  onChangeItem: (item: string | undefined, index: number) => void;
  onRemoveItem: (index: number) => void;
  onMoveItem?: (field: string, index: number) => void;
  onFindItem?: (field: string) => number;
}

const NewItem: FC<Props> = ({
  onRemoveItem,
  onChangeItem,
  draggable,
  onFindItem,
  onMoveItem,
  index,
  value,
  placeholder,
}) => {
  return (
    <li key={`${value}_${index}`}>
      {draggable ? (
        <DraggableItem id={value} findItem={onFindItem} moveItem={onMoveItem}>
          <NewItemInput
            value={value}
            index={index}
            placeholder={placeholder}
            onChangeItem={onChangeItem}
            onRemoveItem={onRemoveItem}
          />
        </DraggableItem>
      ) : (
        <NewItemInput
          value={value}
          index={index}
          placeholder={placeholder}
          onChangeItem={onChangeItem}
          onRemoveItem={onRemoveItem}
        />
      )}
    </li>
  );
};

export default NewItem;
