import { IconPlus } from '@tabler/icons-react';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { DialCheckbox, DialNeutralButton } from '@epam/ai-dial-ui-kit';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import Search from '@/src/components/Common/Search/Search';
import NewItem from '@/src/components/Common/Multiselect/Modal/NewItem';

interface Props {
  addTitle?: string;
  addPlaceholder?: string;
  items: string[];
  selectedItems: string[];
  draggable?: boolean;
  setSelectedItems: Dispatch<SetStateAction<string[]>>;
  setNewItems: Dispatch<SetStateAction<string[]>>;
}

const MultiselectContentModal: FC<Props> = ({
  addTitle,
  selectedItems,
  draggable,
  addPlaceholder,
  items,
  setSelectedItems,
  setNewItems,
}) => {
  const [newItems, setItems] = useState<string[]>([]);

  const [filteredItems, setFilteredItems] = useState<string[]>(items);
  const [filteredNewItems, setFilteredNewItems] = useState<string[]>([]);

  const newItemsContainer = useRef<HTMLDivElement | null>(null);
  const [, drop] = useDrop(() => ({ accept: 'column' }));

  drop(newItemsContainer);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  useEffect(() => {
    setNewItems(newItems);
    setFilteredNewItems(newItems);
  }, [newItems, setNewItems]);

  useEffect(() => {
    if (draggable) {
      setItems(items);
      setFilteredNewItems(items);
    }
  }, [setItems, draggable, items]);

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

  const onChangeNewItem = useCallback(
    (topic: string | undefined, index: number) => {
      newItems[index] = topic?.trimStart() || '';
      setItems([...newItems]);
    },
    [setItems, newItems],
  );

  const onRemoveNewItem = useCallback(
    (index: number) => {
      newItems.splice(index, 1);
      setItems([...newItems]);
    },
    [setItems, newItems],
  );

  const onFilterItems = useCallback(
    (pattern: string) => {
      setFilteredItems(items.filter((item) => item.toLowerCase().includes(pattern.toLowerCase())));
      setFilteredNewItems(newItems.filter((item) => item.toLowerCase().includes(pattern.toLowerCase())));
    },
    [items, newItems],
  );

  const onAddItem = useCallback(() => {
    const newValues = [...newItems, ''];
    setItems(newValues);

    if ((!newItems || !newItems.length) && draggable) {
      setItems(newValues);
      setFilteredNewItems(newValues);
    }
  }, [setItems, newItems, draggable]);

  useEffect(() => {
    const container = newItemsContainer.current;
    if (container && container.scrollHeight > container.clientHeight) {
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  }, [newItems.length]);

  const findItem = useCallback((field?: string) => newItems.findIndex((c) => c === field), [newItems]);

  const moveItem = useCallback(
    (field: string, atIndex: number) => {
      const newIndex = findItem(field);
      const updateItems = [...newItems];
      const [removedItem] = updateItems.splice(newIndex, 1);
      updateItems.splice(atIndex, 0, removedItem);

      setItems(updateItems);
    },
    [findItem, newItems],
  );

  return (
    <>
      <div className="flex flex-col gap-y-2 overflow-auto max-h-[464px]">
        {items.length > 10 ? (
          <div>
            <Search onChange={onFilterItems} />
          </div>
        ) : null}
        <div className="flex flex-col gap-y-2 overflow-auto flex-1 min-h-0" ref={newItemsContainer}>
          {filteredItems.map((item, index) => {
            return (
              !draggable && (
                <DialCheckbox
                  key={index}
                  checked={selectedItems.includes(item)}
                  id={index.toString()}
                  label={item}
                  onChange={(v) => onChangeSelectedItems(item, v)}
                />
              )
            );
          })}
          {(draggable ? newItems : filteredNewItems).map((item, index) => {
            return (
              <NewItem
                key={index}
                value={item}
                draggable={draggable}
                onChangeItem={onChangeNewItem}
                onRemoveItem={onRemoveNewItem}
                index={index}
                placeholder={addPlaceholder}
                onFindItem={findItem}
                onMoveItem={moveItem}
              />
            );
          })}
        </div>
      </div>
      {addTitle && (
        <div>
          <DialNeutralButton
            className="mt-2"
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            label={addTitle}
            onClick={onAddItem}
          />
        </div>
      )}
    </>
  );
};

export default MultiselectContentModal;
