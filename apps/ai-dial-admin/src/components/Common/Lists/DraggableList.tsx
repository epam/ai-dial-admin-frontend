import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// One rendered row: its text plus its position in the authored list, which is what every mutation addresses
// it by. Filtering changes which rows render, never what they are, so the position has to travel with the row
// rather than be re-derived from the render order.
interface VisibleRow {
  value: string;
  index: number;
}

const DraggableList: FC<Props> = ({ items, setItems, filter, addTitle, addPlaceholder }) => {
  const newItemsContainer = useRef<HTMLUListElement | null>(null);

  // The authored list, and the only thing published upward. The search narrows what renders
  // (`visibleRows`) and deliberately does not touch this: filtering used to replace it with the matching
  // subset, so applying while a term was typed committed only those and silently dropped every other
  // authored item.
  const [list, setList] = useState<string[]>(items);

  const [, drop] = useDrop(() => ({ accept: 'column' }));

  drop(newItemsContainer);

  useEffect(() => {
    setList(items);
  }, [items]);

  useEffect(() => {
    setItems(list);
  }, [list, setItems]);

  const isFiltering = Boolean(filter);

  const visibleRows = useMemo<VisibleRow[]>(() => {
    const rows = list.map((value, index) => ({ value, index }));
    if (!filter) {
      return rows;
    }
    const term = filter.toLowerCase();
    return rows.filter((row) => row.value.toLowerCase().includes(term));
  }, [filter, list]);

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
        {visibleRows.map((row) => (
          // Keyed by authored position, as the checkbox list's rows are: the items are plain strings with no
          // id, they are edited in place, and two of them may hold the same text while the user is typing —
          // so the text is not a usable identity. Each row reads its text from props and holds no state a
          // shift would strand.
          <NewItem
            key={`item_${row.index}`}
            value={row.value}
            // A drag while filtering has no defined meaning — the two rows either side of the drop are not
            // the neighbours it would reorder — so reordering is offered only over the whole list.
            draggable={!isFiltering}
            onChangeItem={onChangeNewItem}
            onRemoveItem={onRemoveNewItem}
            index={row.index}
            placeholder={addPlaceholder}
            onFindItem={findItem}
            onMoveItem={moveItem}
          />
        ))}
      </ul>
      {addTitle && (
        <div>
          <DialNeutralButton
            className="self-start"
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            label={addTitle}
            onClick={onAddItem}
          />
        </div>
      )}
    </>
  );
};

export default DraggableList;
