import { FC, useCallback, useEffect, useState } from 'react';
import { ButtonVariant, DialButton, DialPopup } from '@epam/ai-dial-ui-kit';

import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { ButtonsI18nKey, DuplicateI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  entity: DialApplicationScheme;
  onDuplicate: (entity: DialApplicationScheme) => void;
}

const DuplicateScheme: FC<Props> = ({ onDuplicate, isModalOpen, onClose, entity }) => {
  const t = useI18n();

  const [clonedEntity, setEntity] = useState<DialApplicationScheme>({ ...entity, $id: '' });
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
    <DialPopup
      onClose={onClose}
      title={t(DuplicateI18nKey.ApplicationRunner)}
      portalId="DuplicateScheme"
      open={isModalOpen}
      footer={
        <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
          <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

          <DialButton
            variant={ButtonVariant.Primary}
            title={t(ButtonsI18nKey.Duplicate)}
            disable={!isValid}
            onClick={() => onDuplicate(clonedEntity)}
          />
        </div>
      }
    >
      <div className="flex flex-col px-6 py-4 gap-y-6">
        <IdControl
          isUrlId={true}
          entity={{ name: clonedEntity.$id }}
          onChangeEntity={(entity) => onChangeId(entity.name)}
        />
        <DisplayNameControl displayName={clonedEntity['dial:applicationTypeDisplayName']} onChange={onChangeName} />
      </div>
    </DialPopup>
  );
};

export default DuplicateScheme;
