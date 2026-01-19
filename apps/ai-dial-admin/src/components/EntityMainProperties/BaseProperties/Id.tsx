import { useCallback, useEffect, useState } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { getErrorForName, getErrorForUrlId } from '@/src/utils/validation/name-error';
import { FieldError } from '@/src/models/error';

interface Props<T> {
  entity: T;
  fieldTitle?: string;
  placeholder?: string;
  names?: string[];
  isUrlId?: boolean;
  isUniqueNameError?: boolean;
  isDeploymentId?: boolean;
  disabled?: boolean;
  onChangeEntity?: (entity: T) => void;
}

const IdControl = <T extends { name?: string }>({
  fieldTitle,
  placeholder,
  entity,
  names,
  isUrlId,
  isUniqueNameError,
  isDeploymentId,
  disabled,
  onChangeEntity,
}: Props<T>) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [nameError, setNameError] = useState<FieldError | null>(null);

  const validateName = useCallback(
    (name?: string) => {
      const error = isUrlId
        ? getErrorForUrlId(name, names, t)
        : getErrorForName(name, names, t, isUniqueNameError, true, false, isDeploymentId);
      setNameError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !error });
    },
    [dispatch, isDeploymentId, isUniqueNameError, isUrlId, names, t],
  );

  const onChangeName = useCallback(
    (name?: string) => {
      onChangeEntity?.({ ...entity, name: name?.trimStart() });
      validateName(name);
    },
    [entity, onChangeEntity, validateName],
  );

  useEffect(() => {
    if (entity.name) {
      validateName(entity.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUniqueNameError]);

  return (
    <DialTextInputField
      placeholder={placeholder || t(EntityPlaceholdersI18nKey.Id)}
      fieldTitle={fieldTitle || t(EntityFieldsI18nKey.id)}
      elementId="name"
      value={entity.name}
      onChange={onChangeName}
      errorText={nameError?.text}
      invalid={!!nameError}
      disabled={disabled}
    />
  );
};

export default IdControl;
