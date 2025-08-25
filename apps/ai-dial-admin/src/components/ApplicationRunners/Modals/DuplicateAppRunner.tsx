import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Popup from '@/src/components/Common/Popup/Popup';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import { ButtonsI18nKey, DuplicateI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { FieldError } from '@/src/models/error';
import { PopUpState } from '@/src/types/pop-up';
import { getErrorForAppRunnerId } from '../ConfigurationView/utils';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  entity: DialApplicationScheme;
  onDuplicate: (entity: DialApplicationScheme) => void;
}

const DuplicateScheme: FC<Props> = ({ onDuplicate, modalState, onClose, entity }) => {
  const t = useI18n() as (str: string) => string;
  const { dispatch, isValid } = useSaveValidationContext();
  const [clonedEntity, setEntity] = useState<DialApplicationScheme>({ ...entity, $id: '' });
  const [idError, setIdError] = useState<FieldError | null>(null);

  const onChangeId = useCallback(
    (id: string) => {
      const error = getErrorForAppRunnerId(id, t);
      setIdError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'id', isValid: !error });

      setEntity({ ...clonedEntity, $id: id });
    },
    [t, dispatch, clonedEntity],
  );

  const onChangeName = useCallback(
    (name: string) => {
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
        <TextInputField
          elementId="id"
          placeholder={t(EntityPlaceholdersI18nKey.Id)}
          fieldTitle={t(EntityFieldsI18nKey.id)}
          value={clonedEntity.$id}
          errorText={idError?.text}
          invalid={!!idError}
          onChange={onChangeId}
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
