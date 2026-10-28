import { FC, useCallback, useState } from 'react';

import { useI18n } from '@/src/locales/client';
import { toEntitySelectPath } from '@/src/utils/files/path';
import { ENTITY_SELECT_CONFIGS } from './constants';
import EntitySelectManager from './EntitySelectManager';
import { EntitySelectType } from './models';
import SelectInputPopup from './SelectInputPopup';

interface Props {
  entityType: EntitySelectType;
  /** The entity reference, `<prefix><bucket>/<path>`. */
  value: string;
  label?: string;
  elementId?: string;
  disabled?: boolean;
  inputClassName?: string;
  onChangeValue: (value: string) => void;
}

const EntitySelectInput: FC<Props> = ({
  entityType,
  value,
  label,
  elementId,
  disabled,
  inputClassName,
  onChangeValue,
}) => {
  const { prefix, headerI18nKey, portalId, FolderProvider } = ENTITY_SELECT_CONFIGS[entityType];
  const t = useI18n();

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const reference = toEntitySelectPath(value, prefix);

  const onOpen = useCallback(() => {
    // A pick that was cancelled must not survive into the next open: the browser would not show it as selected.
    setSelectedPath(null);
    setIsModalOpen(true);
  }, []);

  const onClose = useCallback(() => setIsModalOpen(false), []);

  const onConfirm = useCallback(() => {
    if (!selectedPath) {
      return;
    }
    onChangeValue(`${prefix}${selectedPath}`);
    setIsModalOpen(false);
  }, [onChangeValue, prefix, selectedPath]);

  return (
    // Own provider so the popup's folder state is isolated from the entity's Assets page.
    <FolderProvider>
      <SelectInputPopup
        displayValue={reference}
        header={t(headerI18nKey)}
        portalId={portalId}
        isOpen={isModalOpen}
        isConfirmDisabled={!selectedPath}
        label={label}
        elementId={elementId}
        disabled={disabled}
        inputClassName={inputClassName}
        onOpen={onOpen}
        onClose={onClose}
        onConfirm={onConfirm}
        onChangeValue={onChangeValue}
      >
        <div className="size-full min-h-0 overflow-hidden">
          <EntitySelectManager
            entityType={entityType}
            value={reference.slice(prefix.length)}
            isModalOpen={isModalOpen}
            onChangeSelectedPath={setSelectedPath}
          />
        </div>
      </SelectInputPopup>
    </FolderProvider>
  );
};

export default EntitySelectInput;
