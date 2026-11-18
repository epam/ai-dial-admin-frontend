'use client';

import { FC, useCallback, useState } from 'react';

import { Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ENTITY_SELECT_CONFIGS } from './constants';
import EntitySelectManager from './EntitySelectManager';
import { EntitySelectType, PickedEntity } from './models';

interface Props {
  entityType: EntitySelectType;
  isOpen: boolean;
  header: string;
  /** One entity at a time: a pick on any tab replaces the previous one, and `onApply` gets at most one. */
  isSingle?: boolean;
  onClose: () => void;
  /** Receives the picked entities, each with the source it was picked from. */
  onApply: (entities: PickedEntity[]) => void;
}

/**
 * A pick over every source an entity has (Public tree, Platform, config.json), in a popup. The folder state is
 * the entity type's own provider, so it is isolated from the page the popup opens over.
 */
const SelectEntitiesPopup: FC<Props> = ({ entityType, isOpen, header, isSingle, onClose, onApply }) => {
  const t = useI18n();
  const { FolderProvider, portalId } = ENTITY_SELECT_CONFIGS[entityType];
  const [selectedEntities, setSelectedEntities] = useState<PickedEntity[]>([]);

  const onChangeSelectedEntity = useCallback(
    (entity: PickedEntity | null) => setSelectedEntities(entity ? [entity] : []),
    [],
  );

  const onCancel = useCallback(() => {
    // A cancelled pick must not survive into the next open: the browser would not show it as selected.
    setSelectedEntities([]);
    onClose();
  }, [onClose]);

  const onConfirm = useCallback(() => {
    onApply(selectedEntities);
    setSelectedEntities([]);
  }, [onApply, selectedEntities]);

  return (
    <FolderProvider>
      <Popup
        header={header}
        portalId={portalId}
        open={isOpen}
        onClose={onCancel}
        className="md:h-[800px]"
        size={PopupSize.Lg}
        mainButtons={getFormPopupButtons({
          cancelLabel: t(ButtonsI18nKey.Cancel),
          submitLabel: t(ButtonsI18nKey.Apply),
          isSubmitDisabled: selectedEntities.length === 0,
          onCancel,
          onSubmit: onConfirm,
        })}
      >
        <div className="size-full min-h-0 overflow-hidden">
          <EntitySelectManager
            entityType={entityType}
            value=""
            isModalOpen={isOpen}
            onChangeSelectedEntities={isSingle ? undefined : setSelectedEntities}
            onChangeSelectedEntity={isSingle ? onChangeSelectedEntity : undefined}
          />
        </div>
      </Popup>
    </FolderProvider>
  );
};

export default SelectEntitiesPopup;
