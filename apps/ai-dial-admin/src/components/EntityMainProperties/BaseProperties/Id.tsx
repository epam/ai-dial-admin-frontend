import { useCallback, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getErrorForName } from '@/src/utils/validation/name-error';

interface Props<T> {
  entity: T;
  names?: string[];
  onChangeEntity?: (entity: T) => void;
}

const IdControl = <T extends { name?: string }>({ entity, names, onChangeEntity }: Props<T>) => {
  const t = useI18n() as (t: string) => string;
  const { dispatch } = useSaveValidationContext();

  const [nameError, setNameError] = useState<FieldError | null>(null);

  const onChangeName = useCallback(
    (name: string) => {
      const newEntity = { ...entity, name };
      const error = getErrorForName(name, names, t);
      setNameError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !error });
      onChangeEntity?.(newEntity);
    },
    [dispatch, entity, names, onChangeEntity, t],
  );

  return (
    <TextInputField
      placeholder={t(EntityPlaceholdersI18nKey.Id)}
      fieldTitle={t(EntityFieldsI18nKey.id)}
      elementId="name"
      value={entity.name}
      onChange={onChangeName}
      errorText={nameError?.text}
      invalid={!!nameError}
    />
  );
};

export default IdControl;
