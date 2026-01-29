import { FC, useCallback, useEffect, useRef } from 'react';
import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import { FieldError } from '@/src/models/error';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

import Item from '@/src/components/Deployments/Common/ItemsList/Item';

interface Props {
  items: string[];
  setItems: (items: string[]) => void;
  addItemLabel?: string;
  validate?: (item?: string) => FieldError | null;
}

const ItemsList: FC<Props> = ({ items, setItems, addItemLabel, validate }) => {
  const lastItemRef = useRef<HTMLLIElement | null>(null);

  const onChangeItem = useCallback(
    (item: string | undefined, index: number) => {
      const updated = [...items];
      updated[index] = item?.trim() || '';
      setItems(updated);
    },
    [items, setItems],
  );

  const onRemoveItem = useCallback(
    (index: number) => {
      const updated = [...items];
      updated.splice(index, 1);

      setItems(updated);
    },
    [items, setItems],
  );

  const onAddItem = useCallback(() => {
    setItems([...items, '']);
  }, [items, setItems]);

  useEffect(() => {
    lastItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [items]);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <ul className="flex flex-col gap-4 overflow-scroll">
        {items.map((item, index) => (
          <Item
            item={item}
            index={index}
            onChange={onChangeItem}
            onRemove={onRemoveItem}
            validate={validate}
            ref={index === items.length - 1 ? lastItemRef : null}
          />
        ))}
      </ul>
      <div className="flex">
        <DialGhostButton
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          label={addItemLabel}
          onClick={onAddItem}
        />
      </div>
    </div>
  );
};

export default ItemsList;
