import { FC, useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Loader from '@/src/components/Common/Loader/Loader';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { PopUpState } from '@/src/types/pop-up';
import { getErrorNotification } from '@/src/utils/notification';
import { uniq } from 'lodash';
import MultiselectContentModal from './ModalContent';

interface Props {
  initSelectedItems?: string[];
  modalState: PopUpState;
  heading?: string;
  addTitle?: string;
  addPlaceholder?: string;
  allItems?: string[];
  draggable?: boolean;
  editMode?: boolean;
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
    onSelectItems?.([...selectedItems, ...newItems].filter((t) => t !== ''));
    onClose();
  }, [onSelectItems, selectedItems, newItems, onClose]);

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

  return (
    <Popup onClose={onClose} heading={heading} portalId="itemsMultiSelect" state={modalState}>
      <div className="flex flex-col overflow-auto px-6 py-4">
        {isLoading ? (
          <Loader size={40} />
        ) : (
          <MultiselectContentModal
            items={items}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            setNewItems={setNewItems}
            {...props}
          />
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
