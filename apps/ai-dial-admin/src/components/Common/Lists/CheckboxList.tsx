import { FC, useCallback, useEffect, useState } from 'react';
import NewItem from '@/src/components/Common/Multiselect/Modal/NewItem';
import { DialCheckbox, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  items: string[];
  selectedItems: string[];
  setItems: (items: string[]) => void;
  setSelectedItems: (items: string[]) => void;
  filter?: string;
  addTitle?: string;
  addPlaceholder?: string;
}

const CheckboxList: FC<Props> = ({
  items,
  setItems,
  selectedItems,
  setSelectedItems,
  filter,
  addTitle,
  addPlaceholder,
}) => {
  const [list, setList] = useState<string[]>(items);
  const [newList, setNewList] = useState<string[]>([]);

  useEffect(() => {
    setList(items);
  }, [items]);

  useEffect(() => {
    setItems(newList);
  }, [newList, setItems]);

  useEffect(() => {
    if (filter) {
      setList(items.filter((i) => i.toLowerCase().includes(filter.toLowerCase())));
    }
  }, [filter, items]);

  const onChangeSelectedItems = useCallback(
    (item: string, value?: boolean) => {
      if (value) {
        setSelectedItems([...selectedItems, item]);
      } else {
        setSelectedItems(selectedItems.filter((t) => t !== item));
      }
    },
    [setSelectedItems, selectedItems],
  );

  const onChangeNewItem = useCallback((item: string | undefined, index: number) => {
    setNewList((prev) => {
      const updated = [...prev];
      updated[index] = item?.trimStart() || '';

      return updated;
    });
  }, []);

  const onRemoveNewItem = useCallback((index: number) => {
    setNewList((prev) => {
      const updated = [...prev];
      prev.splice(index, 1);

      return updated;
    });
  }, []);

  const onAddItem = useCallback(() => {
    setNewList((prev) => [...prev, '']);
  }, []);

  return (
    <>
      <ul className="flex flex-col gap-y-2 overflow-auto flex-1 min-h-0">
        {list.map((item, index) => (
          <li key={`item_${index}`}>
            <DialCheckbox
              checked={selectedItems.includes(item)}
              id={index.toString()}
              label={item}
              onChange={(v) => onChangeSelectedItems(item, v)}
            />
          </li>
        ))}
        {newList.map((item, index) => {
          return (
            <NewItem
              key={`new-item_${index}`}
              value={item}
              draggable={false}
              onChangeItem={onChangeNewItem}
              onRemoveItem={onRemoveNewItem}
              index={index}
              placeholder={addPlaceholder}
            />
          );
        })}
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

export default CheckboxList;
