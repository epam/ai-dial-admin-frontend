import { DialInput, DialRemoveButton } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import DraggableItem from '@/src/components/Common/DraggableItem/DraggableItem';

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
      <div className="flex flex-row gap-x-2 items-center w-full">
        <div className="flex-1 min-w-0">
          <DialInput
            elementId={`item-${index}`}
            value={value}
            placeholder={placeholder}
            onChange={(v) => onChangeItem(v, index)}
          />
        </div>
        <DialRemoveButton disabled={!value} onClick={() => onRemoveItem(index)} />
      </div>
    );
  };

  return draggable ? (
    <DraggableItem id={value} findItem={onFindItem} moveItem={onMoveItem}>
      {getItemContent()}
    </DraggableItem>
  ) : (
    getItemContent()
  );
};

export default NewItemInput;
