import { FC, useCallback, useState } from 'react';

import Search from '@/src/components/Common/Search/Search';
import DraggableList from '@/src/components/Common/Lists/DraggableList';
import CheckboxList from '@/src/components/Common/Lists/CheckboxList';

interface Props {
  addTitle?: string;
  addPlaceholder?: string;
  items: string[];
  selectedItems: string[];
  draggable?: boolean;
  setSelectedItems: (items: string[]) => void;
  setItems: (items: string[]) => void;
}

const MultiselectContentModal: FC<Props> = ({
  addTitle,
  selectedItems,
  draggable,
  addPlaceholder,
  items,
  setSelectedItems,
  setItems,
}) => {
  const [filter, setFilter] = useState<string>('');

  const onFilterItems = useCallback((pattern: string) => {
    setFilter(pattern);
  }, []);

  return (
    <div className="flex flex-col gap-y-2 overflow-auto max-h-[464px]">
      {items.length > 10 && <Search onChange={onFilterItems} />}
      {draggable ? (
        <DraggableList
          items={items}
          setItems={setItems}
          filter={filter}
          addTitle={addTitle}
          addPlaceholder={addPlaceholder}
        />
      ) : (
        <CheckboxList
          items={items}
          selectedItems={selectedItems}
          setItems={setItems}
          setSelectedItems={setSelectedItems}
          filter={filter}
          addTitle={addTitle}
          addPlaceholder={addPlaceholder}
        />
      )}
    </div>
  );
};

export default MultiselectContentModal;
