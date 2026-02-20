import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import NewItem from '@/src/components/Common/Multiselect/Modal/NewItem';
import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  items: string[];
  setItems: (items: string[]) => void;
  filter?: string;
  addTitle?: string;
  addPlaceholder?: string;
}

const DraggableList: FC<Props> = ({ items, setItems, filter, addTitle, addPlaceholder }) => {
  const newItemsContainer = useRef<HTMLUListElement | null>(null);

  const [list, setList] = useState<string[]>(items);

  const [, drop] = useDrop(() => ({ accept: 'column' }));

  drop(newItemsContainer);

  useEffect(() => {
    setList(items);
  }, [items]);

  useEffect(() => {
    setItems(list);
  }, [list, setItems]);

  useEffect(() => {
    if (filter) {
      setList(items.filter((i) => i.toLowerCase().includes(filter.toLowerCase())));
    }
  }, [filter, items]);

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
  }, [list.length]);

  const findItem = useCallback((field?: string) => list.findIndex((c) => c === field), [list]);

  const moveItem = useCallback(
    (field: string, atIndex: number) => {
      setList((prev) => {
        const newIndex = findItem(field);
        const updateItems = [...prev];
        const [removedItem] = updateItems.splice(newIndex, 1);
        updateItems.splice(atIndex, 0, removedItem);

        return updateItems;
      });
    },
    [findItem],
  );

  const onChangeNewItem = useCallback((item: string | undefined, index: number) => {
    setList((prev) => {
      const updated = [...prev];
      updated[index] = item?.trimStart() || '';

      return updated;
    });
  }, []);

  const onRemoveNewItem = useCallback((index: number) => {
    setList((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);

      return updated;
    });
  }, []);

  const onAddItem = useCallback(() => {
    setList((prev) => [...prev, '']);
  }, []);

  return (
    <>
      <ul className="flex flex-col gap-y-2 overflow-auto flex-1 min-h-0" ref={newItemsContainer}>
        {list.map((item, index) => (
          <NewItem
            key={`${item}_${index}`}
            value={item}
            draggable={true}
            onChangeItem={onChangeNewItem}
            onRemoveItem={onRemoveNewItem}
            index={index}
            placeholder={addPlaceholder}
            onFindItem={findItem}
            onMoveItem={moveItem}
          />
        ))}
      </ul>
      {addTitle && (
        <DialNeutralButton
          className="self-start"
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          label={addTitle}
          onClick={onAddItem}
        />
      )}
    </>
  );
};

export default DraggableList;
