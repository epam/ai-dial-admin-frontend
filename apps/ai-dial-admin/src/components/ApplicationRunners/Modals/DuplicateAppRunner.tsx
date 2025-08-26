import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { ButtonsI18nKey, DuplicateI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  entity: DialApplicationScheme;
  onDuplicate: (entity: DialApplicationScheme) => void;
}

const DuplicateScheme: FC<Props> = ({ onDuplicate, modalState, onClose, entity }) => {
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
    dispatch({ type: ValidationActionType.SetField, field: 'id', isValid: !!clonedEntity.$id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Popup
      onClose={onClose}
      heading={t(DuplicateI18nKey.ApplicationRunnerHeader)}
      portalId="DuplicateKey"
      state={modalState}
    >
      <div className="flex flex-col px-6 py-4 gap-y-6">
        <IdControl
          isUrlId={true}
          entity={{ name: clonedEntity.$id }}
          onChangeEntity={(entity) => onChangeId(entity.name)}
        />
        <DisplayNameControl displayName={clonedEntity['dial:applicationTypeDisplayName']} onChange={onChangeName} />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button
          cssClass="secondary"
          dataTestId="cancelBtn"
          title={t(ButtonsI18nKey.Cancel)}
          onClick={() => onClose()}
        />

        <Button
          cssClass="primary"
          dataTestId="duplicateBtn"
          title={t(ButtonsI18nKey.Duplicate)}
          disable={!isValid}
          onClick={() => onDuplicate(clonedEntity)}
        />
      </div>
    </Popup>
  );
};

export default DuplicateScheme;
