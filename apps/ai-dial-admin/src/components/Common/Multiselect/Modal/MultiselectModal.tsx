import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Button from '@/src/components/Common/Button/Button';
import Loader from '@/src/components/Common/Loader/Loader';
import Popup from '@/src/components/Common/Popup/Popup';
import { baseColumnComparator } from '@/src/components/Grid/comparators/base-column-comparator';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { PopUpState } from '@/src/types/pop-up';
import { getErrorNotification } from '@/src/utils/notification';
import { isEqual, uniq } from 'lodash';
import MultiselectContentModal from './ModalContent';

interface Props {
  initSelectedItems?: string[];
  modalState: PopUpState;
  heading?: string;
  addTitle?: string;
  addPlaceholder?: string;
  allItems?: string[];
  draggable?: boolean;
  onClose: () => void;
  onSelectItems?: (items: string[]) => void;
  getItems?: () => Promise<ServerActionResponse>;
}

const MultiselectModal: FC<Props> = ({
  initSelectedItems,
  modalState,
  heading,
  allItems,
  onClose,
  onSelectItems,
  getItems,
  draggable,
  ...props
}) => {
  const t = useI18n();

  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>(initSelectedItems || []);
  const [items, setItems] = useState<string[]>([]);
  const [newItems, setNewItems] = useState<string[]>([]);

  const onApply = useCallback(() => {
    if (draggable) {
      onSelectItems?.([...newItems].filter((t) => t !== ''));
    } else {
      onSelectItems?.([...selectedItems, ...newItems].filter((t) => t !== ''));
    }
    onClose();
  }, [selectedItems, newItems, draggable, onClose, onSelectItems]);

  useEffect(() => {
    const filtered = newItems.filter((v) => v !== '');
    setIsValid(!!items.length || !!filtered.length);
  }, [items, newItems]);

  useEffect(() => {
    if (getItems) {
      setIsLoading(true);
      getItems().then((res) => {
        if (res.success) {
          const items = uniq([...((res.response as string[]) || []), ...(allItems || [])]);

          setItems(items.sort(baseColumnComparator));
          setIsLoading(false);
        } else {
          showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage));
          setIsLoading(false);
        }
      });
    } else if (allItems) {
      setItems(allItems);
    }
  }, [setItems, getItems, allItems]);

  return (
    <Popup onClose={onClose} heading={heading} portalId="itemsMultiSelect" state={modalState}>
      <div className="flex flex-col overflow-auto px-6 py-4">
        {isLoading ? (
          <Loader size={40} />
        ) : (
          <DndProvider backend={HTML5Backend}>
            <MultiselectContentModal
              items={items}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              setNewItems={setNewItems}
              draggable={draggable}
              {...props}
            />
          </DndProvider>
        )}
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Apply)}
          onClick={onApply}
          disable={!isValid || isEqual(newItems, selectedItems)}
        />
      </div>
    </Popup>
  );
};

export default MultiselectModal;
