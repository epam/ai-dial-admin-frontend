import { Popup } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { FC, useCallback, useEffect, useState } from 'react';

import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  names: string[];
  entity: DialApplicationScheme;
  onDuplicate: (entity: DialApplicationScheme) => void;
}

const DuplicateScheme: FC<Props> = ({ names, onDuplicate, isModalOpen, onClose, entity }) => {
  const t = useI18n();

  const [clonedEntity, setEntity] = useState<DialApplicationScheme>({
    ...entity,
    $id: getClonedEntityName(entity.$id, false, '/'),
  });
  const { dispatch, isValid } = useSaveValidationContext();

  const onChangeId = useCallback(
    (id?: string) => {
      setEntity({ ...clonedEntity, $id: id });
    },
    [setEntity, clonedEntity],
  );

  const onChangeName = useCallback(
    (name?: string) => {
      setEntity({ ...clonedEntity, 'dial:applicationTypeDisplayName': name });
    },
    [clonedEntity],
  );

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!clonedEntity.$id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Popup
      onClose={onClose}
      header={t(getCloneTitle(ApplicationRoute.ApplicationRunners, t))}
      portalId="DuplicateScheme"
      open={isModalOpen}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Duplicate),
        isSubmitDisabled: !isValid,
        onCancel: onClose,
        onSubmit: () => onDuplicate(clonedEntity),
      })}
    >
      <div className="flex flex-col px-6 py-4 gap-y-8">
        <IdControl
          isUrlId={true}
          entity={{ name: clonedEntity.$id }}
          onChangeEntity={(entity) => onChangeId(entity.name)}
          names={names}
        />
        <DisplayNameControl
          displayName={clonedEntity['dial:applicationTypeDisplayName']}
          onChange={onChangeName}
          required
        />
      </div>
    </Popup>
  );
};

export default DuplicateScheme;
