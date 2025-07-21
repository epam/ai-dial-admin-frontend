import { IconPlus } from '@tabler/icons-react';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Checkbox from '@/src/components/Common/Checkbox/Checkbox';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import NewItemInput from './NewItemInput';

interface Props {
  addTitle?: string;
  addPlaceholder?: string;
  items: string[];
  selectedItems: string[];
  draggable?: boolean;
  editMode?: boolean;
  setSelectedItems: Dispatch<SetStateAction<string[]>>;
  setNewItems: Dispatch<SetStateAction<string[]>>;
}

const MultiselectContentModal: FC<Props> = ({
  addTitle,
  selectedItems,
  draggable,
  editMode,
  addPlaceholder,
  items,
  setSelectedItems,
  setNewItems,
}) => {
  const [newItems, setItems] = useState<string[]>([]);
  const newItemsContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNewItems(newItems);
  }, [setNewItems, newItems]);

  const onChangeSelectedItems = useCallback(
    (topic: string, value?: boolean) => {
      if (value) {
        setSelectedItems([...selectedItems, topic]);
      } else {
        setSelectedItems(selectedItems.filter((t) => t !== topic));
      }
    },
    [setSelectedItems, selectedItems],
  );

  const onChangeItem = useCallback(
    (topic: string, index: number) => {
      items[index] = topic.trimStart();
      setSelectedItems([...items]);
    },
    [setSelectedItems, items],
  );

  const onChangeNewItem = useCallback(
    (topic: string, index: number) => {
      newItems[index] = topic.trimStart();
      setItems([...newItems]);
    },
    [setItems, newItems],
  );

  const onRemoveItem = useCallback(
    (index: number) => {
      newItems.splice(index, 1);
      setItems([...newItems]);
    },
    [setItems, newItems],
  );

  const onAddItem = useCallback(() => {
    setItems([...newItems, '']);
  }, [setItems, newItems]);

  useEffect(() => {
    const container = newItemsContainer.current;
    if (container && container.scrollHeight > container.clientHeight) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [newItems.length]);

  return (
    <>
      <div className="flex flex-col gap-y-2 overflow-auto" ref={newItemsContainer}>
        {items.map((item, index) => {
          return editMode ? (
            <NewItemInput
              key={index}
              value={item}
              onChangeItem={onChangeItem}
              onRemoveItem={onRemoveItem}
              index={index}
              placeholder={addPlaceholder}
            />
          ) : (
            <Checkbox
              key={index}
              checked={selectedItems.includes(item)}
              id={index.toString()}
              label={item}
              onChange={(v) => onChangeSelectedItems(item, v)}
            />
          );
        })}

        {newItems.map((item, index) => {
          return (
            <NewItemInput
              key={index}
              value={item}
              onChangeItem={onChangeNewItem}
              onRemoveItem={onRemoveItem}
              index={index}
              placeholder={addPlaceholder}
            />
          );
        })}
      </div>
      {addTitle && (
        <div>
          <Button
            cssClass="secondary mt-2"
            iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
            title={addTitle}
            onClick={onAddItem}
          />
        </div>
      )}
    </>
  );
};

export default MultiselectContentModal;
