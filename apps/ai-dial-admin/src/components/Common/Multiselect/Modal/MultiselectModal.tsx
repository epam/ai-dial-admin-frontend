import { DialFormPopup, DialLoader } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { baseColumnComparator } from '@/src/components/Grid/comparators/base-column-comparator';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';
import { isEqual, uniq } from 'lodash';
import MultiselectContentModal from './ModalContent';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { isErrorPresent } from '@/src/utils/deployments/containers';

interface Props {
  initSelectedItems?: string[];
  isModalOpen: boolean;
  heading?: string;
  addTitle?: string;
  addPlaceholder?: string;
  allItems?: string[];
  draggable?: boolean;
  applyButtonText?: string;
  onClose: () => void;
  onSelectItems?: (items: string[]) => void;
  getItems?: () => Promise<ServerActionResponse>;
}

const MultiselectModal: FC<Props> = ({
  initSelectedItems,
  isModalOpen,
  heading,
  allItems,
  onClose,
  onSelectItems,
  getItems,
  draggable,
  applyButtonText,
  ...props
}) => {
  const t = useI18n();
  const { isValid, errorFields } = useSaveValidationContext();

  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  const [isListValid, setListIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>(initSelectedItems || []);
  const [items, setItems] = useState<string[]>([]);
  const [newItems, setNewItems] = useState<string[]>([]);
  const [isModalInvalid, setModalInvalid] = useState(false);

  useEffect(() => {
    if (!isValid) {
      setModalInvalid(isErrorPresent(errorFields, ['topic_']));
    } else {
      setModalInvalid(false);
    }
  }, [errorFields, isValid]);

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
    setListIsValid(!!items.length || !!filtered.length);
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
          showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
          setIsLoading(false);
        }
      });
    } else if (allItems) {
      setItems(allItems);
    }
  }, [setItems, getItems, allItems]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={heading}
      portalId="itemsMultiSelect"
      open={isModalOpen}
      onSubmit={onApply}
      onCancel={onClose}
      submitLabel={applyButtonText || t(ButtonsI18nKey.Apply)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      disableSubmitButton={isModalInvalid || !isListValid || (draggable && isEqual(newItems, selectedItems))}
    >
      <div className="flex flex-col overflow-auto px-6 py-4">
        {isLoading ? (
          <DialLoader size={40} />
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
    </DialFormPopup>
  );
};

export default MultiselectModal;
