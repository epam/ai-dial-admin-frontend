import { useCallback, useEffect, useMemo } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { getErrorForName, getErrorForUrlId } from '@/src/utils/validation/name-error';

interface Props<T> {
  entity: T;
  fieldTitle?: string;
  placeholder?: string;
  names?: string[];
  isUrlId?: boolean;
  isUniqueNameError?: boolean;
  onChangeEntity?: (entity: T) => void;
}

const IdControl = <T extends { name?: string }>({
  fieldTitle,
  placeholder,
  entity,
  names,
  isUrlId,
  isUniqueNameError,
  onChangeEntity,
}: Props<T>) => {
  const t = useI18n() as (t: string) => string;
  const { dispatch } = useSaveValidationContext();

  const nameError = useMemo(() => {
    return isUrlId
      ? getErrorForUrlId(entity.name, names, t)
      : getErrorForName(entity.name, names, t, isUniqueNameError);
  }, [entity.name, isUniqueNameError, isUrlId, names, t]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !nameError });
  }, [nameError, t, dispatch]);

  const onChangeName = useCallback(
    (name?: string) => {
      onChangeEntity?.({ ...entity, name });
    },
    [entity, onChangeEntity],
  );

  return (
    <TextInputField
      placeholder={placeholder || t(EntityPlaceholdersI18nKey.Id)}
      fieldTitle={fieldTitle || t(EntityFieldsI18nKey.id)}
      elementId="name"
      value={entity.name}
      onChange={onChangeName}
      errorText={nameError?.text}
      invalid={!!nameError}
    />
  );
};

export default IdControl;
