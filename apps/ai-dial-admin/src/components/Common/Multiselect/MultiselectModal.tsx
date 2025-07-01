import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { IconPlus } from '@tabler/icons-react';

import Button from '@/src/components/Common/Button/Button';
import Checkbox from '@/src/components/Common/Checkbox/Checkbox';
import Loader from '@/src/components/Common/Loader/Loader';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { getErrorNotification } from '@/src/utils/notification';
import { ServerActionResponse } from '@/src/models/server-action';
import NewItemInput from './NewItemInput';
import { uniq } from 'lodash';

interface Props {
  initSelectedItems?: string[];
  modalState: PopUpState;
  heading: string;
  addTitle?: string;
  addPlaceholder?: string;
  allItems?: string[];
  onClose: () => void;
  onSelectItems: (items: string[]) => void;
  getItems?: () => Promise<ServerActionResponse>;
}

const MultiselectModal: FC<Props> = ({
  initSelectedItems,
  modalState,
  heading,
  addTitle,
  addPlaceholder,
  allItems,
  onClose,
  onSelectItems,
  getItems,
}) => {
  const t = useI18n();

  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>(initSelectedItems || []);
  const [items, setItems] = useState<string[]>([]);
  const [newItems, setNewItems] = useState<string[]>([]);
  const newItemsContainer = useRef<HTMLDivElement | null>(null);

  const onApply = useCallback(() => {
    onSelectItems([...selectedItems, ...newItems].filter((t) => t !== ''));
    onClose();
  }, [onSelectItems, selectedItems, newItems, onClose]);

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
      newItems[index] = topic.trimStart();
      setNewItems([...newItems]);
    },
    [setNewItems, newItems],
  );

  const onRemoveItem = useCallback(
    (index: number) => {
      newItems.splice(index, 1);
      setNewItems([...newItems]);
    },
    [setNewItems, newItems],
  );

  const onAddItem = useCallback(() => {
    setNewItems([...newItems, '']);
  }, [setNewItems, newItems]);

  useEffect(() => {
    const filtered = newItems.filter((v) => v !== '');
    setIsValid(!!items.length || !!filtered.length);
  }, [items, newItems]);

  useEffect(() => {
    if (getItems) {
      setIsLoading(true);
      getItems().then((res) => {
        if (res.success) {
          setItems(uniq([...((res.response as string[]) || []), ...(allItems || [])]));
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
    <Popup onClose={onClose} heading={heading} portalId="itemsMultiSelect" state={modalState}>
      <div className="flex flex-col overflow-auto px-6 py-4">
        {isLoading ? (
          <Loader size={40} />
        ) : (
          <>
            <div className="flex flex-col gap-y-2 overflow-auto" ref={newItemsContainer}>
              {items.map((item, index) => {
                return (
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
                    onChangeItem={onChangeItem}
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
        )}
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button cssClass="primary" title={t(ButtonsI18nKey.Apply)} onClick={onApply} disable={!isValid} />
      </div>
    </Popup>
  );
};

export default MultiselectModal;
